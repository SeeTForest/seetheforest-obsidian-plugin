import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const { runtimeNotices } = await import(
  new URL("../scripts/runtime-notices.mjs", import.meta.url).href
);

async function fixture(name: string, version: string, license = "MIT") {
  const root = await mkdtemp(path.join(tmpdir(), "stf-notices-"));
  const relative = `node_modules/${name}`;
  const dir = path.join(root, relative);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({ name, version, license }),
  );
  return { root, dir, meta: [{ inputs: { [`${relative}/index.js`]: {} } }] };
}

test("bundled notices preserve shipped license text", async () => {
  const f = await fixture("sample", "1.0.0");
  try {
    await writeFile(path.join(f.dir, "LICENSE"), "Exact shipped notice");
    assert.match(await runtimeNotices(f.root, f.meta), /Exact shipped notice/);
  } finally {
    await rm(f.root, { recursive: true });
  }
});

test("known omitted license uses the exact pinned upstream attribution", async () => {
  const f = await fixture("@pixi/colord", "2.9.6");
  try {
    const notice = await runtimeNotices(f.root, f.meta);
    assert.match(notice, /Copyright \(c\) 2020 Vlad Shilov/);
    assert.match(notice, /5344fbf77b736f81cd33c21050021bc09bc9dd1d/);
    assert.match(notice, /THE SOFTWARE IS PROVIDED/);
  } finally {
    await rm(f.root, { recursive: true });
  }
});

test("unreviewed package versions and licenses still fail closed", async () => {
  for (const [version, license] of [
    ["2.9.7", "MIT"],
    ["2.9.6", "unknown"],
  ]) {
    const f = await fixture("@pixi/colord", version!, license!);
    try {
      await assert.rejects(
        runtimeNotices(f.root, f.meta),
        /Missing bundled dependency license/,
      );
    } finally {
      await rm(f.root, { recursive: true });
    }
  }
});
