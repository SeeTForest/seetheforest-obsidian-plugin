import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { hash } from "./atlas-verification.mjs";

export const COMMUNITY_FILES = ["main.js", "manifest.json", "styles.css"];

/** Recover binary literals without executing the plugin or rewriting its bytes. */
export function embeddedAssetBytes(main, expected) {
  const candidates = new Map();
  for (const match of main.matchAll(/["']([A-Za-z0-9+/]{80,}={0,2})["']/g)) {
    const bytes = Buffer.from(match[1], "base64");
    if (bytes.toString("base64") === match[1])
      candidates.set(hash(bytes), bytes);
  }
  const result = {};
  for (const role of ["worker", "wasm", "layout"]) {
    const description = expected?.[role];
    const bytes = candidates.get(description?.sha256);
    if (!bytes || bytes.length !== description.bytes)
      throw Error(`Missing or altered embedded asset: ${role}`);
    result[role] = bytes;
  }
  return result;
}

export async function verifyRuntimeDirectory(dist, integrity) {
  const names = (await readdir(dist)).sort();
  if (
    JSON.stringify(names) !== JSON.stringify([...COMMUNITY_FILES].sort()) ||
    JSON.stringify(Object.keys(integrity.files).sort()) !==
      JSON.stringify(names)
  )
    throw Error(
      "Community installation must contain exactly three runtime files",
    );
  for (const name of names) {
    const bytes = await readFile(path.join(dist, name));
    if (hash(bytes) !== integrity.files[name])
      throw Error(`Altered runtime file: ${name}`);
    if (
      /sourceMappingURL|E:[\\/]0-Notes|my-notes-private|BEGIN PRIVATE KEY/.test(
        bytes.toString(),
      )
    )
      throw Error("Private or debug data in runtime package");
  }
  const main = await readFile(path.join(dist, "main.js"), "utf8");
  const assets = embeddedAssetBytes(main, integrity.embeddedAssets);
  // A standard install must also carry license notices, without extra downloads.
  const banner = main.match(
    /^\/\*! See the Forest bundled runtime notices\n([\s\S]*?)\n\*\/\n/,
  );
  if (!banner || hash(banner[1]) !== integrity.noticesSha256)
    throw Error("Bundled license notices missing or changed");
  for (const [role, bytes] of Object.entries(assets))
    if (
      /sourceMappingURL|E:[\\/]0-Notes|[A-Za-z]:[\\/]Users[\\/]|\/(?:home|Users)\/|my-notes-private|BEGIN PRIVATE KEY/.test(
        bytes.toString(),
      )
    )
      throw Error(`Private or debug data in embedded ${role}`);
  const manifest = JSON.parse(
    await readFile(path.join(dist, "manifest.json"), "utf8"),
  );
  if (manifest.version !== integrity.version)
    throw Error("Manifest version mismatch");
  return assets;
}
