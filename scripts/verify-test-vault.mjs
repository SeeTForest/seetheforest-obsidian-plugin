// Read-only identity check. Never installs a plugin or marks host tests passed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMUNITY_FILES, verifyRuntimeDirectory } from "./package-validation.mjs";
import { hash } from "./atlas-verification.mjs";

export async function compareInstalledRuntime(directory, integrity) {
  const files = {};
  for (const name of COMMUNITY_FILES) {
    assert.match(integrity.files?.[name] ?? "", /^[a-f0-9]{64}$/, "Expected runtime hash required");
    try {
      const actual = hash(await readFile(path.join(directory, name)));
      files[name] = { expected: integrity.files[name], actual, matches: actual === integrity.files[name] };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      files[name] = { expected: integrity.files[name], actual: null, matches: false };
    }
  }
  return { matches: Object.values(files).every((file) => file.matches), files };
}

export async function checkTestVault(receiptPath, vaultDirectory) {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(receipt.mode, "full", "A full CI receipt is required");
  assert.equal(receipt.status, "passed", "CI must have passed before installed-byte comparison");
  for (const name of ["atlas-preflight", "build", "verify:package", "verify:installed-runtime", "archive"])
    assert.equal(receipt.phases?.find((phase) => phase.name === name)?.status, "passed", `Missing passed phase: ${name}`);
  assert.equal(receipt.atlas?.signatureVerified, true);
  assert.equal(receipt.atlas?.hostApiVerified, true);
  const workspace = path.join(path.dirname(receiptPath), "workspace");
  const integrity = JSON.parse(await readFile(path.join(workspace, "outputs/package-integrity.json"), "utf8"));
  assert.deepEqual(integrity, receipt.packageIntegrity, "Receipt and build integrity differ");
  assert.equal(integrity.atlas.version, receipt.atlas.version);
  assert.equal(integrity.atlas.sha256, receipt.atlas.sha256);
  await verifyRuntimeDirectory(path.join(workspace, "dist/seetheforest-atlas"), integrity);
  const comparison = await compareInstalledRuntime(
    path.join(vaultDirectory, ".obsidian/plugins/seetheforest-atlas"), integrity);
  return {
    kind: "installed-byte-comparison-only",
    pluginVersion: integrity.version,
    atlas: integrity.atlas,
    ...comparison,
    realObsidianAcceptance: "not-run",
    releaseAuthorized: false,
    note: "Local receipt is not a signed attestation. Matching bytes do not prove compatibility, licensing or host acceptance.",
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw Error("Usage: node scripts/verify-test-vault.mjs <full-ci-receipt.json>");
    const root = fileURLToPath(new URL("../", import.meta.url));
    const result = await checkTestVault(path.resolve(process.argv[2]), path.join(root, "test-vaults/AtlasPlugin-Test"));
    console.log(JSON.stringify(result, null, 2));
    if (!result.matches) process.exitCode = 1;
  } catch {
    console.error("Test Vault check failed: verify the full CI receipt, its preserved workspace and file permissions. No files were changed.");
    process.exitCode = 1;
  }
}
