import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, copyFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ATLAS, publicDependencyLock, checkContract } from "../../scripts/ci-contract.mjs";
import { verifyAtlas, verifyHostApi, hash } from "../../scripts/atlas-verification.mjs";
import { releaseInputs } from "../../scripts/fetch-atlas.mjs";
import { createArchive, verifyArchive } from "../../scripts/package-archive.mjs";
import { unzipSync, zipSync } from "fflate";

const root = fileURLToPath(new URL("../../", import.meta.url));
test("source dependency projection removes only Atlas and leaves original locks intact", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
  // Tests also run inside the already-projected public source workspace.
  pkg.dependencies[ATLAS] = "file:vendor/atlas.tgz";
  lock.packages[""].dependencies[ATLAS] = "file:vendor/atlas.tgz";
  lock.packages[`node_modules/${ATLAS}`] = { version: "test", resolved: "file:vendor/atlas.tgz" };
  const original = JSON.stringify({ pkg, lock });
  const derived = publicDependencyLock(pkg, lock);
  assert.equal(JSON.stringify({ pkg, lock }), original);
  assert.equal(derived.pkg.dependencies[ATLAS], undefined);
  assert.equal(derived.lock.packages[`node_modules/${ATLAS}`], undefined);
  for (const [name, entry] of Object.entries(lock.packages))
    if (name && name !== `node_modules/${ATLAS}`) assert.deepEqual(derived.lock.packages[name], entry);
  lock.packages["node_modules/unexpected"] = { resolved: "file:../private", integrity: "sha512-test" };
  assert.throws(() => publicDependencyLock(pkg, lock), /public npm registry/);
});

test("host contract fails closed for baseline and pre-selection Atlas", () => {
  const verified = (types) => ({ read: () => Buffer.from(types) });
  assert.throws(() => verifyHostApi(verified("")), /host API v1/);
  assert.throws(() => verifyHostApi(verified("ATLAS_HOST_API_VERSION runtimeAssets?: host?:")), /nodeActivation/);
  assert.doesNotThrow(() => verifyHostApi(verified("ATLAS_HOST_API_VERSION runtimeAssets?: host?: nodeActivation?")));
});

test("manifest, version map, dependency and license drift are rejected", async () => {
  const base = path.join(root, "artifacts/validation/ci-tests");
  await mkdir(base, { recursive: true });
  // The nested runner creates another workspace; use a short synthetic-only
  // scratch path so Windows mkdtemp does not exceed its path-length limit.
  const dir = await mkdtemp(path.join(tmpdir(), "stf-ci-contract-"));
  await mkdir(path.join(dir, "vendor"));
  const names = ["package.json", "package-lock.json", "manifest.json", "versions.json", "vendor/atlas.lock.json"];
  const files = Object.fromEntries(await Promise.all(names.map(async (name) => [name, JSON.parse(await readFile(path.join(root, name), "utf8"))])));
  const atlas = files["vendor/atlas.lock.json"];
  files["package.json"].dependencies[ATLAS] = "file:vendor/atlas.tgz";
  files["package-lock.json"].packages[""].dependencies[ATLAS] = "file:vendor/atlas.tgz";
  files["package-lock.json"].packages[`node_modules/${ATLAS}`] = { version: atlas.version, license: "SEE LICENSE IN LICENSE" };
  const save = async () => {
    for (const [name, value] of Object.entries(files)) await writeFile(path.join(dir, name), JSON.stringify(value));
  };
  await writeFile(path.join(dir, "LICENSE"), await readFile(path.join(root, "LICENSE")));
  await copyFile(path.join(root, "ATLAS-RUNTIME-PERMISSION.txt"), path.join(dir, "ATLAS-RUNTIME-PERMISSION.txt"));
  await save();
  await checkContract(dir);
  files["package-lock.json"].packages[`node_modules/${ATLAS}`].license = "MIT";
  await save();
  await assert.rejects(checkContract(dir), /Atlas must retain/);
  files["package-lock.json"].packages[`node_modules/${ATLAS}`].license = "SEE LICENSE IN LICENSE";
  for (const [file, key, value] of [["manifest.json", "version", "9.9.9"], ["manifest.json", "isDesktopOnly", false],
    ["package.json", "license", "UNLICENSED"], ["package.json", "private", false], ["versions.json", files["package.json"].version, "0.0.0"]]) {
    const old = files[file][key];
    files[file][key] = value;
    await save();
    await assert.rejects(checkContract(dir));
    files[file][key] = old;
  }
  // Last saved fixture still has an invalid version map: runner must exit 1
  // and persist a failure receipt before any install or protected input access.
  await mkdir(path.join(dir, "scripts"));
  for (const name of ["ci.mjs", "ci-contract.mjs", "atlas-verification.mjs"])
    await copyFile(path.join(root, "scripts", name), path.join(dir, "scripts", name));
  assert.throws(() => execFileSync(process.execPath, ["scripts/ci.mjs", "full"], { cwd: dir, stdio: "pipe", windowsHide: true }), (error) => error.status === 1);
  const [run] = await readdir(path.join(dir, "artifacts/validation/ci"));
  const receipt = JSON.parse(await readFile(path.join(dir, "artifacts/validation/ci", run, "receipt.json"), "utf8"));
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.failure, "contract");
  assert.equal(receipt.phases.length, 1);
  assert.equal(receipt.acceptance.releaseAuthorized, false);
});

test("Atlas tampering, untrusted key and bad signature fail before archive extraction", async () => {
  const base = path.join(root, "artifacts/validation/ci-tests");
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, "signature-"));
  const { publicKey } = generateKeyPairSync("ed25519");
  const bytes = Buffer.from("synthetic archive; never a real Atlas package");
  const lock = { sha256: hash(bytes), publicKeySha256: hash(publicKey.export({ type: "spki", format: "der" })) };
  const paths = ["test.tgz", "test.sig", "public.pem"].map((name) => path.join(dir, name));
  await writeFile(paths[0], bytes);
  await writeFile(paths[1], Buffer.alloc(64));
  await writeFile(paths[2], publicKey.export({ type: "spki", format: "pem" }));
  await assert.rejects(verifyAtlas(...paths, { ...lock, sha256: "0".repeat(64) }), /SHA-256 mismatch/);
  await assert.rejects(verifyAtlas(...paths, { ...lock, publicKeySha256: "0".repeat(64) }), /Untrusted/);
  await assert.rejects(verifyAtlas(...paths, lock), /Invalid Atlas Ed25519 signature/);
});

test("download configuration requires explicit enablement, token and exact release", () => {
  const env = { ATLAS_CI_ENABLED: "true", ATLAS_RELEASE_REPOSITORY: "example/release",
    ATLAS_RELEASE_TAG: "v0.1.6", GH_TOKEN: "synthetic-test-token" };
  const lock = { version: "0.1.6" };
  assert.equal(releaseInputs(env, lock).names[0], "seetheforest-atlas-0.1.6.tgz");
  for (const key of Object.keys(env)) assert.throws(() => releaseInputs({ ...env, [key]: "" }, lock));
  assert.throws(() => releaseInputs({ ...env, ATLAS_RELEASE_TAG: "--latest" }, lock));
  assert.throws(() => releaseInputs({ ...env, ATLAS_RELEASE_REPOSITORY: "https://untrusted.example" }, lock));
  assert.throws(() => releaseInputs(env, { version: "../../file" }));
});

test("cross-platform ZIP is deterministic, exactly three files and byte-preserving", async () => {
  const files = { "main.js": Buffer.from("synthetic runtime"), "manifest.json": Buffer.from('{"version":"0.1.0"}'), "styles.css": Buffer.from("/* styles */") };
  const expected = Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, hash(bytes)]));
  const zip = createArchive(files, expected);
  assert.deepEqual(zip, createArchive(files, expected));
  verifyArchive(zip, expected);
  for (const [name, bytes] of Object.entries(unzipSync(zip)))
    assert.deepEqual(Buffer.from(bytes), files[path.basename(name)]);
  assert.throws(() => verifyArchive(Buffer.alloc(512), expected), /Expected ZIP/);
  assert.throws(() => verifyArchive(zip, { ...expected, "main.js": "bad" }), /hash mismatch/);
  assert.throws(() => verifyArchive(zipSync({ ...unzipSync(zip), "secret.txt": Buffer.from("test") }), expected), /exactly three/);
  const dir = path.join(root, "artifacts/validation/ci-tests");
  await mkdir(dir, { recursive: true });
  const run = await mkdtemp(path.join(dir, "zip-"));
  await writeFile(path.join(run, "fixture.zip"), zip);
});

test("workflows keep untrusted checks separate and never publish closed assets", async () => {
  const source = await readFile(path.join(root, ".github/workflows/source-ci.yml"), "utf8");
  const full = await readFile(path.join(root, ".github/workflows/protected-ci.yml"), "utf8");
  assert.match(source, /pull_request:/);
  assert.doesNotMatch(source, /secrets\.|pull_request_target|workflow_run|fetch-atlas/);
  assert.match(full, /if: github.ref == 'refs\/heads\/main'/);
  assert.match(full, /environment: atlas-ci/);
  assert.doesNotMatch(full, /^\s+(?:push|pull_request|pull_request_target|workflow_run):/m);
  for (const content of [source, full]) {
    assert.match(content, /contents: read/);
    assert.match(content, /persist-credentials: false/);
    assert.match(content, /package-manager-cache: false/);
    assert.doesNotMatch(content, /uses: .*upload-artifact|npm publish|gh release create|contents: write/);
    for (const match of content.matchAll(/uses: ([^\s]+)/g)) assert.match(match[1], /@[a-f0-9]{40}$/);
  }
});
