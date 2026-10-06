import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "./atlas-verification.mjs";
import { COMMUNITY_FILES, verifyRuntimeDirectory } from "./package-validation.mjs";
import { createArchive, verifyArchive } from "./package-archive.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const integrity = JSON.parse(
  await readFile(path.join(root, "outputs/package-integrity.json"), "utf8"),
);
await verifyRuntimeDirectory(
  path.join(root, "dist/seetheforest-atlas"),
  integrity,
);
const manifest = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8"),
);
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw Error("Invalid version");
await mkdir(path.join(root, "outputs"), { recursive: true });
const file = path.join(
  root,
  "outputs",
  `seetheforest-atlas-obsidian-${manifest.version}.zip`,
);
const files = Object.fromEntries(await Promise.all(COMMUNITY_FILES.map(async (name) => [
  name, await readFile(path.join(root, "dist/seetheforest-atlas", name)),
])));
await writeFile(file, createArchive(files, integrity.files));
verifyArchive(await readFile(file), integrity.files);
const digest = hash(await readFile(file));
await writeFile(`${file}.sha256`, `${digest}  ${path.basename(file)}\n`);
console.log(`Created ${path.basename(file)} SHA-256 ${digest}`);
