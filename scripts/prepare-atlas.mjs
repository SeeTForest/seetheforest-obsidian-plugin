import { mkdir, readFile, copyFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { verifyAtlas } from "./atlas-verification.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const [archive, signature, key] = process.argv.slice(2);
if (!archive || !signature || !key)
  throw Error(
    "Usage: npm run prepare:atlas -- <archive.tgz> <signature.sig> <public-key.pem>",
  );
const lock = JSON.parse(
  await readFile(path.join(root, "vendor/atlas.lock.json"), "utf8"),
);
const result = await verifyAtlas(archive, signature, key, lock);
await mkdir(path.join(root, "vendor"), { recursive: true });
for (const [source, name] of [
  [archive, "atlas.tgz"],
  [signature, "atlas.sig"],
  [key, "atlas-public.pem"],
])
  await copyFile(source, path.join(root, "vendor", name));
await mkdir(path.join(root, "outputs"), { recursive: true });
await writeFile(
  path.join(root, "outputs/atlas-verification.json"),
  JSON.stringify(
    {
      version: lock.version,
      sha256: lock.sha256,
      sourceCommit: result.protection.sourceCommit,
      signatureVerified: true,
    },
    null,
    2,
  ),
);
console.log(
  `Verified Atlas ${lock.version}. Build separately checks the native host API.`,
);
