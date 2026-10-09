import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAtlas, verifyHostApi } from "./atlas-verification.mjs";

/** Fail closed: only signed production artifacts and public API declarations. */
export function inspectReviewPackage(verified) {
  const expected = [
    "LICENSE", "README.md", "index.js", "package.json", "solid.js", "styles.css",
    "types/index.d.ts", "types/protected.d.ts", "types/solid.d.ts",
  ];
  const files = Object.keys(verified.protection.files);
  const workers = files.filter((name) => /^assets\/physics\.worker-[\w-]+\.js$/.test(name));
  const wasm = files.filter((name) => /^assets\/physics-core-[a-f0-9]+\.wasm$/.test(name));
  assert.equal(workers.length, 1, "Expected one production physics Worker");
  assert.equal(wasm.length, 1, "Expected one production Wasm module");
  assert.deepEqual([...files].sort(), [...expected, ...workers, ...wasm].sort(), "Unexpected Atlas review input member");
  const forbidden = /sourceMappingURL|sourceURL=|[A-Za-z]:[\\/](?:Users|0-Notes)[\\/]|\/(?:home|Users)\/|my-notes-private|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/;
  for (const file of files) {
    const bytes = verified.read(file);
    assert.ok(!forbidden.test(bytes.toString()), `Private or debug marker in Atlas member: ${file}`);
    if (file.endsWith(".wasm")) {
      const module = new WebAssembly.Module(bytes);
      for (const section of ["name", ".debug_info", ".debug_line", ".debug_str", "sourceMappingURL", "external_debug_info"])
        assert.equal(WebAssembly.Module.customSections(module, section).length, 0, "Debug metadata in production Wasm");
    }
  }
  assert.ok(!forbidden.test(JSON.stringify(verified.protection)), "Private marker in protection manifest");
  return files.sort();
}

export async function verifyReviewInputs(root) {
  const lock = JSON.parse(await readFile(path.join(root, "vendor/atlas.lock.json"), "utf8"));
  const verified = await verifyAtlas(...["atlas.tgz", "atlas.sig", "atlas-public.pem"].map(name => path.join(root, "vendor", name)), lock);
  verifyHostApi(verified);
  const files = inspectReviewPackage(verified);
  return { atlasVersion: lock.version, archiveSha256: lock.sha256, signatureVerified: true,
    files, sourceIncluded: false, sourceMapsIncluded: false,
    scope: "Signed artifact allowlist and private/debug marker checks; not a promise of resistance to reverse engineering" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await verifyReviewInputs(fileURLToPath(new URL("../", import.meta.url))), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
