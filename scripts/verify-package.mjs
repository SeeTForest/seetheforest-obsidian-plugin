import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { verifyRuntimeDirectory } from "./package-validation.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const integrity = JSON.parse(
  await readFile(path.join(root, "outputs/package-integrity.json"), "utf8"),
);
await verifyRuntimeDirectory(
  path.join(root, "dist/seetheforest-atlas"),
  integrity,
);
console.log(
  "Three-file installation, embedded asset hashes, notices and leak checks passed.",
);
