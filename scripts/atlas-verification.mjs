import { createHash, createPublicKey, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
// Shared by build and CI preflight; only inspect the verified public contract.
export function verifyHostApi(verified) {
  const types = verified.read("types/solid.d.ts").toString();
  if (!["ATLAS_HOST_API_VERSION", "runtimeAssets?:", "host?:"].every((field) => types.includes(field)))
    throw Error("Atlas signed baseline has no native host API v1. A reviewed, signed upstream release is required; refusing an unusable plugin package.");
  if (!types.includes("nodeActivation?"))
    throw Error("Atlas signed release lacks host.nodeActivation. A signed select-before-read candidate is required; refusing conflicting node navigation.");
}
export async function verifyAtlas(archive, signature, key, lock) {
  const [bytes, sig, pem] = await Promise.all([
    readFile(archive),
    readFile(signature),
    readFile(key),
  ]);
  if (hash(bytes) !== lock.sha256)
    throw Error("Atlas archive SHA-256 mismatch");
  const publicKey = createPublicKey(pem);
  if (
    hash(publicKey.export({ type: "spki", format: "der" })) !==
    lock.publicKeySha256
  )
    throw Error("Untrusted Atlas signing key");
  if (!verify(null, Buffer.from(hash(bytes), "hex"), publicKey, sig))
    throw Error("Invalid Atlas Ed25519 signature");
  const tar = (args) =>
    execFileSync("tar", args, {
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
    });
  const entries = tar(["-tf", archive]).toString().trim().split(/\r?\n/);
  for (const entry of entries)
    if (
      !/^package\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/.test(entry) ||
      entry.includes("..") ||
      /\.(map|rs|tsx|wat)$/.test(entry) ||
      (/\.ts$/.test(entry) && !entry.endsWith(".d.ts"))
    )
      throw Error("Forbidden archive member");
  const read = (entry) => tar(["-xOf", archive, `package/${entry}`]);
  const manifest = JSON.parse(read("package.json"));
  const protection = JSON.parse(read("PROTECTION.json"));
  if (
    manifest.name !== lock.package ||
    manifest.version !== lock.version ||
    manifest.exports["./labs"]
  )
    throw Error("Atlas package identity mismatch");
  if (
    protection.sourceDirty !== false ||
    protection.package !== lock.package ||
    protection.version !== lock.version
  )
    throw Error("Atlas release must originate from a clean matching source");
  for (const field of [
    "sourceIncluded",
    "sourceMapsIncluded",
    "labsIncluded",
    "sharedArrayBufferRequired",
  ])
    if (protection.protection[field] !== false)
      throw Error(`Atlas protection failed: ${field}`);
  for (const field of [
    "rustWasmOptimized",
    "rustWasmDebugStripped",
    "javascriptMinified",
    "javascriptIdentifiersMangled",
    "wasmNameSectionStripped",
    "wasmProductionExportsOnly",
  ])
    if (protection.protection[field] !== true)
      throw Error(`Atlas protection failed: ${field}`);
  for (const entry of entries) {
    const relative = entry.slice(8);
    if (
      relative !== "PROTECTION.json" &&
      hash(read(relative)) !== protection.files[relative]
    )
      throw Error("Atlas member hash mismatch");
  }
  return { manifest, protection, read };
}
