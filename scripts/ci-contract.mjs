import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const ATLAS = "@seetheforest/atlas";
export function publicDependencyLock(pkg, lock) {
  const result = structuredClone({ pkg, lock });
  assert.equal(result.pkg.dependencies[ATLAS], "file:vendor/atlas.tgz");
  assert.equal(result.lock.lockfileVersion, 3);
  assert.equal(result.lock.packages[""].dependencies[ATLAS], "file:vendor/atlas.tgz");
  assert.ok(result.lock.packages[`node_modules/${ATLAS}`]);
  delete result.pkg.dependencies[ATLAS];
  delete result.lock.packages[""].dependencies[ATLAS];
  delete result.lock.packages[`node_modules/${ATLAS}`];
  // No second private registry, local path, or sneaky nested Atlas dependency.
  for (const [name, entry] of Object.entries(result.lock.packages)) {
    assert.ok(!name.includes(ATLAS), "Private package in source-only dependency lock");
    if (name) {
      assert.ok(entry.resolved?.startsWith("https://registry.npmjs.org/"), "Source CI only accepts public npm registry dependencies");
      assert.match(entry.integrity ?? "", /^sha512-/, "Dependency integrity required");
    }
  }
  return result;
}

export async function checkContract(root) {
  const json = async (name) => JSON.parse(await readFile(path.join(root, name), "utf8"));
  const [pkg, lock, manifest, versions, atlas] = await Promise.all([
    "package.json", "package-lock.json", "manifest.json", "versions.json", "vendor/atlas.lock.json",
  ].map(json));
  assert.equal(pkg.name, "seetheforest-obsidian-plugin");
  assert.equal(manifest.id, "seetheforest-atlas");
  assert.equal(typeof manifest.description, "string");
  assert.ok(manifest.description.length > 0 && manifest.description.length <= 250);
  assert.ok(manifest.description.endsWith("."), "Community description must end with a period");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.match(manifest.minAppVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.version, manifest.version);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[""].version, pkg.version);
  assert.equal(versions[pkg.version], manifest.minAppVersion);
  assert.equal(manifest.isDesktopOnly, true, "Mobile requires separate acceptance before changing this guard");
  assert.equal(pkg.license, "MIT");
  assert.equal(lock.packages[""].license, "MIT");
  assert.match(await readFile(path.join(root, "LICENSE"), "utf8"), /Atlas remains\s+proprietary/);
  const permission = await readFile(path.join(root, "ATLAS-RUNTIME-PERMISSION.txt"), "utf8");
  assert.match(permission, /only as part of this plugin/);
  assert.match(permission, /does not authorize publication of Atlas source code/);
  assert.match(permission, /standalone redistribution of Atlas/);
  for (const group of ["dependencies", "devDependencies"]) {
    assert.deepEqual(pkg[group], lock.packages[""][group]);
    for (const [name, version] of Object.entries(pkg[group]))
      if (name !== ATLAS) assert.match(version, /^\d+\.\d+\.\d+$/, "Pin direct dependencies exactly");
  }
  assert.equal(atlas.package, ATLAS);
  assert.equal(atlas.requiredHostApiVersion, 1);
  for (const key of ["sha256", "publicKeySha256"]) assert.match(atlas[key], /^[a-f0-9]{64}$/);
  assert.equal(lock.packages[`node_modules/${ATLAS}`].version, atlas.version);
  publicDependencyLock(pkg, lock);
  return { pkg, lock, manifest, atlas };
}
