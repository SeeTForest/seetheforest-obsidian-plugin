import { test } from "node:test";
import assert from "node:assert/strict";
import { createRuntimeAssetUrls } from "../src/runtime-assets.ts";

const encoded = {
  worker: Buffer.from("postMessage('worker 中文');").toString("base64"),
  wasm: Buffer.from([0, 97, 115, 109, 0, 128, 255]).toString("base64"),
  layout: Buffer.from("postMessage('layout');").toString("base64"),
};

test("embedded resources preserve exact bytes and MIME without filesystem or network", async (t) => {
  const blobs: Blob[] = [];
  const revoked: string[] = [];
  t.mock.method(URL, "createObjectURL", (blob: Blob) => {
    blobs.push(blob);
    return `blob:test-${blobs.length}`;
  });
  t.mock.method(URL, "revokeObjectURL", (url: string) => revoked.push(url));
  t.mock.method(globalThis, "fetch", () => {
    throw Error("Unexpected network");
  });
  const resources = createRuntimeAssetUrls(encoded);
  assert.equal(resources.workerUrl, "blob:test-1");
  assert.equal(resources.wasmUrl, "blob:test-2");
  assert.equal(resources.layoutUrl, "blob:test-3");
  assert.deepEqual(
    blobs.map((x) => x.type),
    ["text/javascript", "application/wasm", "text/javascript"],
  );
  for (const [index, bytes] of Object.values(encoded).entries())
    assert.deepEqual(
      Buffer.from(await blobs[index]!.arrayBuffer()),
      Buffer.from(bytes, "base64"),
    );
  resources.dispose();
  resources.dispose();
  assert.deepEqual(revoked, ["blob:test-1", "blob:test-2", "blob:test-3"]);
});

test("partial resource creation failure revokes previously allocated URLs", (t) => {
  const revoked: string[] = [];
  let created = 0;
  t.mock.method(URL, "createObjectURL", () => `blob:test-${++created}`);
  t.mock.method(URL, "revokeObjectURL", (url: string) => revoked.push(url));
  assert.throws(() =>
    createRuntimeAssetUrls({ ...encoded, wasm: "!invalid!" }),
  );
  assert.deepEqual(revoked, ["blob:test-1"]);
  assert.throws(
    () => createRuntimeAssetUrls({ ...encoded, worker: "" }),
    /缺少内嵌/,
  );
  assert.equal(created, 1);
});

test("separate owners have independent resources and revocation", (t) => {
  let sequence = 0;
  const revoked: string[] = [];
  t.mock.method(URL, "createObjectURL", () => `blob:test-${++sequence}`);
  t.mock.method(URL, "revokeObjectURL", (url: string) => revoked.push(url));
  const first = createRuntimeAssetUrls(encoded);
  const second = createRuntimeAssetUrls(encoded);
  first.dispose();
  assert.ok(!revoked.includes(second.workerUrl));
  second.dispose();
  assert.equal(new Set(revoked).size, 6);
});
