import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hash } from "./atlas-verification.mjs";
const dist = fileURLToPath(
  new URL("../dist/seetheforest-atlas/", import.meta.url),
);
const integrity = JSON.parse(
  await readFile(path.join(dist, "integrity.json"), "utf8"),
);
for (const entry of await readdir(dist, {
  recursive: true,
  withFileTypes: true,
}))
  if (entry.isFile()) {
    const file = path.join(entry.parentPath, entry.name);
    const name = path.relative(dist, file).replaceAll("\\", "/");
    if (name === "integrity.json") continue;
    const bytes = await readFile(file);
    if (hash(bytes) !== integrity.files[name])
      throw Error(`Unexpected or altered runtime file: ${name}`);
    if (/\.(?:map|ts|tsx|rs|md)$/.test(name))
      throw Error("Source or document in runtime package");
    if (
      /\.(?:js|css|json)$/.test(name) &&
      /sourceMappingURL|E:[\\/]0-Notes|my-notes-private|BEGIN PRIVATE KEY/.test(
        bytes.toString(),
      )
    )
      throw Error("Private or debug data in runtime package");
  }
for (const [name, digest] of Object.entries(integrity.files))
  if (hash(await readFile(path.join(dist, name))) !== digest)
    throw Error("Missing or altered file");
console.log("Runtime whitelist, hashes and leak checks passed.");
