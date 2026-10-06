// Trusted CI only. Read a pinned Release, never search for "latest", sign,
// publish, upgrade locks, or print gh's authenticated diagnostics.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAtlas } from "./atlas-verification.mjs";

export function releaseInputs(env, lock) {
  if (env.ATLAS_CI_ENABLED !== "true") throw Error("Configure the protected atlas-ci Environment before enabling downloads");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.ATLAS_RELEASE_REPOSITORY ?? ""))
    throw Error("ATLAS_RELEASE_REPOSITORY must identify the approved release repository");
  if (!env.GH_TOKEN) throw Error("A read-only release token is required");
  if (!/^[0-9A-Za-z.+-]+$/.test(lock.version)) throw Error("Invalid locked version");
  const tag = env.ATLAS_RELEASE_TAG;
  if (!tag || tag.startsWith("-") || /[\s\\]/.test(tag)) throw Error("Set an exact ATLAS_RELEASE_TAG, never an inferred latest release");
  const archive = `seetheforest-atlas-${lock.version}.tgz`;
  return { repository: env.ATLAS_RELEASE_REPOSITORY, tag, names: [archive, `${archive}.sig`, "atlas-signing-public.pem"] };
}

async function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const lock = JSON.parse(await readFile(path.join(root, "vendor/atlas.lock.json"), "utf8"));
  const input = releaseInputs(process.env, lock);
  const base = path.join(root, "artifacts/validation/atlas-download");
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, "release-"));
  try {
    execFileSync("gh", ["release", "download", input.tag, "--repo", input.repository,
      "--dir", dir, ...input.names.flatMap((name) => ["--pattern", name])],
    { windowsHide: true, stdio: "pipe", timeout: 120_000 });
  } catch { throw Error("Atlas release download failed; check approved repository, exact tag, three asset names and read-only token access"); }
  await verifyAtlas(...input.names.map((name) => path.join(dir, name)), lock);
  // No input reaches npm before independent hash, fingerprint and signature checks.
  for (const [index, name] of ["atlas.tgz", "atlas.sig", "atlas-public.pem"].entries())
    await copyFile(path.join(dir, input.names[index]), path.join(root, "vendor", name));
  console.log("Atlas release verified against tracked lock. No dependency lock was changed.");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); }
  catch (error) {
    // Do not expose authenticated subprocess output, URLs or response bodies.
    console.error(error.code ? "Atlas input verification failed; check configured release assets and tracked lock" : error.message);
    process.exitCode = 1;
  }
}
