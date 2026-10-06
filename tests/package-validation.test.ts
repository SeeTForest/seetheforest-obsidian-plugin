import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
const { embeddedAssetBytes, verifyRuntimeDirectory } = await import(
  new URL("../scripts/package-validation.mjs", import.meta.url).href
);
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const bytes = {
  worker: Buffer.from("worker ".repeat(30)),
  wasm: Buffer.alloc(100, 255),
  layout: Buffer.from("layout ".repeat(30)),
};
const expected = Object.fromEntries(
  Object.entries(bytes).map(([role, value]) => [
    role,
    { bytes: value.length, sha256: hash(value) },
  ]),
);
const notices = "Exact license text";
const main = `/*! See the Forest bundled runtime notices\n${notices}\n*/\nconst assets=${JSON.stringify(Object.fromEntries(Object.entries(bytes).map(([k, b]) => [k, b.toString("base64")])))};`;

test("bundle bytes can be independently recovered and compared without executing code", () => {
  assert.deepEqual(embeddedAssetBytes(main, expected), bytes);
  assert.throws(
    () =>
      embeddedAssetBytes(
        main.replace(bytes.wasm.toString("base64"), "AAAA"),
        expected,
      ),
    /wasm/,
  );
  assert.throws(
    () =>
      embeddedAssetBytes(main, {
        ...expected,
        layout: { ...expected.layout, bytes: 1 },
      }),
    /layout/,
  );
});

test("community package requires exactly three files, valid notices and matching bytes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "stf-package-"));
  const files = {
    "main.js": main,
    "manifest.json": JSON.stringify({ version: "0.1.0" }),
    "styles.css": "/* theme */",
  };
  const integrity = {
    version: "0.1.0",
    files: Object.fromEntries(
      Object.entries(files).map(([k, v]) => [k, hash(v)]),
    ),
    embeddedAssets: expected,
    noticesSha256: hash(notices),
  };
  try {
    for (const [name, value] of Object.entries(files))
      await writeFile(path.join(root, name), value);
    await verifyRuntimeDirectory(root, integrity);
    // Binary payloads must not bypass the private-path checks after Base64 decoding.
    const leakedWasm = Buffer.concat([bytes.wasm, Buffer.from("C:/Users/fixture/rust/core.rs")]);
    const leakedMain = main.replace(bytes.wasm.toString("base64"), leakedWasm.toString("base64"));
    await writeFile(path.join(root, "main.js"), leakedMain);
    await assert.rejects(verifyRuntimeDirectory(root, {
      ...integrity,
      files: { ...integrity.files, "main.js": hash(leakedMain) },
      embeddedAssets: { ...expected, wasm: { bytes: leakedWasm.length, sha256: hash(leakedWasm) } },
    }), /Private or debug data in embedded wasm/);
    await writeFile(path.join(root, "main.js"), main);
    await assert.rejects(
      verifyRuntimeDirectory(root, { ...integrity, noticesSha256: "bad" }),
      /notices/,
    );
    await assert.rejects(
      verifyRuntimeDirectory(root, { ...integrity, version: "9.0.0" }),
      /version/,
    );
    await writeFile(path.join(root, "main.js"), main + "tamper");
    await assert.rejects(verifyRuntimeDirectory(root, integrity), /Altered/);
    await writeFile(path.join(root, "main.js"), main);
    await writeFile(path.join(root, "extra.wasm"), "old asset");
    await assert.rejects(
      verifyRuntimeDirectory(root, integrity),
      /exactly three/,
    );
  } finally {
    if (
      path.dirname(root) !== path.resolve(tmpdir()) ||
      !path.basename(root).startsWith("stf-package-")
    )
      throw Error("Unsafe fixture cleanup");
    await rm(root, { recursive: true });
  }
});
