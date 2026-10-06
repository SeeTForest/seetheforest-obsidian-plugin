import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { hash } from "../../scripts/atlas-verification.mjs";
import { compareInstalledRuntime, checkTestVault } from "../../scripts/verify-test-vault.mjs";

test("installed-byte check reads only three runtime files and preserves settings", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "stf-installed-"));
  const files = { "main.js": "synthetic code", "manifest.json": "{}", "styles.css": "/* css */" };
  const integrity = { files: Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, hash(bytes)])) };
  for (const [name, bytes] of Object.entries(files)) await writeFile(path.join(dir, name), bytes);
  await writeFile(path.join(dir, "data.json"), "synthetic private settings");
  assert.equal((await compareInstalledRuntime(dir, integrity)).matches, true);
  assert.equal(await readFile(path.join(dir, "data.json"), "utf8"), "synthetic private settings");
  await writeFile(path.join(dir, "main.js"), "different candidate");
  const mismatch = await compareInstalledRuntime(dir, integrity);
  assert.equal(mismatch.matches, false);
  assert.equal(mismatch.files["main.js"].matches, false);
  assert.equal(mismatch.files["styles.css"].matches, true);
});

test("missing installed files and malformed expected hashes cannot match", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "stf-installed-"));
  const integrity = { files: Object.fromEntries(["main.js", "manifest.json", "styles.css"].map((name) => [name, hash(name)])) };
  const absent = await compareInstalledRuntime(dir, integrity);
  assert.equal(absent.matches, false);
  assert.ok(Object.values(absent.files).every((file) => file.actual === null));
  await assert.rejects(compareInstalledRuntime(dir, { files: {} }), /hash required/);
});

test("source, incomplete and failed receipts cannot qualify as host acceptance input", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "stf-installed-"));
  const receipt = path.join(dir, "receipt.json");
  for (const data of [
    { mode: "source", status: "passed" },
    { mode: "full", status: "failed" },
    { mode: "full", status: "passed", phases: [] },
  ]) {
    await writeFile(receipt, JSON.stringify(data));
    await assert.rejects(checkTestVault(receipt, path.join(dir, "unused-vault")));
  }
});
