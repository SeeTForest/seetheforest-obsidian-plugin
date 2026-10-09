import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectReviewPackage } from "../../scripts/verify-review-inputs.mjs";

function fixture() {
  const names = ["LICENSE", "README.md", "index.js", "package.json", "solid.js", "styles.css",
    "types/index.d.ts", "types/protected.d.ts", "types/solid.d.ts",
    "assets/physics.worker-test.js", "assets/physics-core-0123.wasm"];
  const content = Object.fromEntries(names.map(n => [n, Buffer.from("fixture")]));
  content["assets/physics-core-0123.wasm"] = Buffer.from([0,97,115,109,1,0,0,0]);
  return { content, protection: { files: Object.fromEntries(names.map(n => [n, "fixture"])) }, read(name) { return this.content[name]; } };
}
test("review input allowlist rejects source and source maps, not only flagged manifests", () => {
  assert.equal(inspectReviewPackage(fixture()).length, 11);
  for (const name of ["src/engine.ts", "solid.js.map", "assets/debug.wasm", "private.pem"]) {
    const f = fixture(); f.protection.files[name] = "fixture";
    assert.throws(() => inspectReviewPackage(f), /Unexpected/);
  }
});
test("review input audit rejects debug metadata and private text in binary assets", () => {
  const f = fixture();
  f.content["index.js"] = Buffer.from("//# sourceMappingURL=source.js.map");
  assert.throws(() => inspectReviewPackage(f), /Private or debug/);
  const wasm = fixture();
  // Valid empty Wasm module with a custom name section.
  wasm.content["assets/physics-core-0123.wasm"] = Buffer.from([0,97,115,109,1,0,0,0,0,5,4,110,97,109,101]);
  assert.throws(() => inspectReviewPackage(wasm), /Debug metadata/);
});
test("only approved compiled Atlas inputs are exceptions to vendor ignore rules", async () => {
  const ignore = await readFile(new URL("../../.gitignore", import.meta.url), "utf8");
  assert.deepEqual(ignore.split(/\r?\n/).filter(l => l.startsWith("!vendor/")),
    ["!vendor/atlas.lock.json", "!vendor/atlas.tgz", "!vendor/atlas.sig", "!vendor/atlas-public.pem"]);
});
test("README has an English product description before localized engineering details", async () => {
  const readme = await readFile(new URL("../../README.md", import.meta.url), "utf8");
  const intro = readme.split("## 中文使用与工程说明")[0];
  assert.match(intro, /Explore your notes as an interactive knowledge constellation/);
  assert.match(intro, /proprietary, closed-source dependency/);
  assert.match(intro, /1\.11\.7/);
  assert.match(intro, /main\.js/);
});
