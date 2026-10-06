import { zipSync, unzipSync } from "fflate";
import { COMMUNITY_FILES } from "./package-validation.mjs";
import { hash } from "./atlas-verification.mjs";

export function verifyArchive(bytes, expected) {
  if (Buffer.from(bytes).readUInt32LE(0) !== 0x04034b50)
    throw Error("Expected ZIP, not a tar archive with a .zip extension");
  const files = unzipSync(bytes);
  const names = COMMUNITY_FILES.map((name) => `seetheforest-atlas/${name}`).sort();
  if (JSON.stringify(Object.keys(files).sort()) !== JSON.stringify(names))
    throw Error("ZIP must contain exactly three plugin runtime files");
  for (const name of COMMUNITY_FILES)
    if (hash(files[`seetheforest-atlas/${name}`]) !== expected[name])
      throw Error(`ZIP runtime hash mismatch: ${name}`);
}

export function createArchive(files, expected) {
  const entries = Object.fromEntries(COMMUNITY_FILES.map((name) => [
    `seetheforest-atlas/${name}`, files[name],
  ]));
  // DOS local wall time, fixed independently of filesystem times/timezone.
  const bytes = zipSync(entries, { level: 6, mtime: new Date(2000, 0, 1) });
  verifyArchive(bytes, expected);
  return bytes;
}
