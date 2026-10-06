// No private dependencies needed to start this runner. Every run gets a fresh
// product-local snapshot; it never edits the source lock or an installed Vault.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, readdir, lstat, copyFile, appendFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkContract, publicDependencyLock } from "./ci-contract.mjs";
import { hash, verifyAtlas, verifyHostApi } from "./atlas-verification.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2];
if (!["source", "full"].includes(mode) || process.argv.length !== 3)
  throw Error("Usage: node scripts/ci.mjs source|full");
const base = path.join(root, "artifacts/validation/ci");
await mkdir(base, { recursive: true });
const run = await mkdtemp(path.join(base, `${mode}-`));
const workspace = path.join(run, "workspace");
const receipt = {
  schemaVersion: 1, mode, startedAt: new Date().toISOString(),
  node: process.version, platform: process.platform, status: "running",
  source: { commit: null, dirty: null, hashes: {} }, phases: [],
  acceptance: { blogVisualInteraction: "not-run", realObsidian: "not-run", communityReview: "not-run", releaseAuthorized: false },
};
const save = () => writeFile(path.join(run, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
async function phase(name, action) {
  const record = { name, status: "running", startedAt: new Date().toISOString() };
  receipt.phases.push(record);
  await save();
  console.log(`[CI] ${name}`);
  try { await action(); record.status = "passed"; }
  catch (error) {
    record.status = "failed";
    await writeFile(path.join(run, `${name.replaceAll(":", "-")}.error.log`), String(error.message) + "\n");
    throw error;
  }
  finally { record.finishedAt = new Date().toISOString(); await save(); }
}
async function snapshot(relative) {
  const source = path.join(root, relative);
  const target = path.join(workspace, relative);
  const stat = await lstat(source);
  if (stat.isSymbolicLink()) throw Error("CI source snapshots do not accept symlinks");
  if (stat.isDirectory()) {
    for (const name of (await readdir(source)).sort()) await snapshot(path.join(relative, name));
  } else if (stat.isFile()) {
    const bytes = await readFile(source);
    receipt.source.hashes[relative.replaceAll("\\", "/")] = hash(bytes);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  } else throw Error("Unsupported source entry");
}
let npm;
async function npmPath() {
  const candidates = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    path.resolve(path.dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js")];
  for (const file of candidates.filter(Boolean)) {
    try { await access(file); return file; } catch { /* next Node distribution layout */ }
  }
  throw Error("Cannot locate npm-cli.js; start with npm run ci:source or npm run ci:full");
}
function execute(name, args) {
  try {
    const output = execFileSync(process.execPath, args, {
      cwd: workspace, windowsHide: true, timeout: 600_000, maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "", NODE_AUTH_TOKEN: "", NPM_TOKEN: "" },
    });
    return writeFile(path.join(run, `${name}.log`), output);
  } catch (error) {
    // Full logs stay local, never blindly printed into possibly public CI logs.
    const output = Buffer.concat([
      Buffer.from(error.stdout ?? ""), Buffer.from(error.stderr ?? ""),
    ]);
    if (mode === "source") console.error(output.toString());
    return writeFile(path.join(run, `${name}.log`), output)
      .then(() => { throw Error(`${name} failed (exit ${error.status ?? "unknown"}); inspect its local log`); });
  }
}
try {
  await phase("contract", async () => {
    if (Number(process.versions.node.split(".")[0]) !== 24) throw Error("CI requires Node.js 24");
    const { atlas } = await checkContract(root);
    receipt.atlas = { version: atlas.version, sha256: atlas.sha256 };
    npm = await npmPath();
    try {
      const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
      if (path.resolve(gitRoot) === path.resolve(root)) {
        receipt.source.commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
        receipt.source.dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", windowsHide: true }).trim());
      }
    } catch { /* exported source: hashes, not a guessed parent-repository commit */ }
  });
  await phase("snapshot", async () => {
    for (const entry of ["src", "scripts", "tests", ".github", "package.json", "package-lock.json", "tsconfig.json", "eslint.config.mjs", "eslint.source.config.mjs", "manifest.json", "versions.json", "styles.css", "LICENSE", "ATLAS-RUNTIME-PERMISSION.txt", "vendor/atlas.lock.json"])
      await snapshot(entry);
    if (mode === "source") {
      const read = async (file) => JSON.parse(await readFile(path.join(workspace, file), "utf8"));
      const derived = publicDependencyLock(await read("package.json"), await read("package-lock.json"));
      for (const [name, data] of [["package.json", derived.pkg], ["package-lock.json", derived.lock]])
        await writeFile(path.join(workspace, name), JSON.stringify(data, null, 2) + "\n");
      receipt.dependencyProjection = "Only Atlas removed from isolated manifest and npm lock; no Atlas type stubs";
    }
  });
  if (mode === "full") await phase("atlas-preflight", async () => {
    const lock = JSON.parse(await readFile(path.join(workspace, "vendor/atlas.lock.json"), "utf8"));
    for (const name of ["atlas.tgz", "atlas.sig", "atlas-public.pem"])
      await copyFile(path.join(root, "vendor", name), path.join(workspace, "vendor", name));
    const verified = await verifyAtlas(...["atlas.tgz", "atlas.sig", "atlas-public.pem"].map((name) => path.join(workspace, "vendor", name)), lock);
    receipt.atlas.signatureVerified = true;
    receipt.atlas.sourceCommit = verified.protection.sourceCommit;
    verifyHostApi(verified);
    receipt.atlas.hostApiVerified = true;
  });
  await phase("install", () => execute("install", [npm, "ci", "--ignore-scripts", "--no-audit", "--no-fund"]));
  await phase("lint", () => execute("lint", [npm, "run", mode === "full" ? "lint" : "lint:source"]));
  // Typechecking without the genuine Atlas declaration would be a false gate.
  if (mode === "full") await phase("typecheck", () => execute("typecheck", [npm, "run", "typecheck"]));
  for (const name of ["test", "test:ci"])
    await phase(name, () => execute(name.replace(":", "-"), [npm, "run", name]));
  if (mode === "full") {
    for (const name of ["build", "verify:package", "verify:installed-runtime", "benchmark"])
      await phase(name, () => execute(name.replace(":", "-"), [npm, "run", name]));
    receipt.syntheticPerformance = JSON.parse(await readFile(path.join(workspace, "outputs/synthetic-performance.json"), "utf8"));
    await phase("archive", () => execute("archive", ["scripts/package.mjs"]));
    receipt.packageIntegrity = JSON.parse(await readFile(path.join(workspace, "outputs/package-integrity.json"), "utf8"));
    const file = `seetheforest-atlas-obsidian-${receipt.packageIntegrity.version}.zip`;
    receipt.archive = { name: file, sha256: hash(await readFile(path.join(workspace, "outputs", file))) };
  }
  receipt.status = "passed";
} catch (error) {
  receipt.status = "failed";
  // Do not serialize errors containing child stdout, tokens, or absolute paths.
  receipt.failure = receipt.phases.find((p) => p.status === "failed")?.name ?? "runner";
  console.error(`[CI] Failed: ${receipt.failure}. ${mode === "full" ? "Check locked Atlas inputs and local phase logs; no release was performed." : "Inspect local phase logs."}`);
  process.exitCode = 1;
} finally {
  receipt.finishedAt = new Date().toISOString();
  await save();
  console.log(`[CI] ${mode}: ${receipt.status}; receipt: ${path.relative(root, run).replaceAll("\\", "/")}/receipt.json`);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Plugin ${mode} CI: ${receipt.status}\n\n` +
      receipt.phases.map((p) => `- ${p.name}: ${p.status}`).join("\n") +
      "\n\nNot a Blog visual regression, real Obsidian acceptance, or release approval. Closed inputs and full logs are not uploaded.\n");
}
