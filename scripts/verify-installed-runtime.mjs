// Exercises the actual three-file bundle with a minimal host double, not a
// real Obsidian window. No rendering, Electron CSP or GPU acceptance is claimed.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { verifyRuntimeDirectory } from "./package-validation.mjs";
import { hash } from "./atlas-verification.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist/seetheforest-atlas");
const integrity = JSON.parse(
  await readFile(path.join(root, "outputs/package-integrity.json"), "utf8"),
);
const embedded = await verifyRuntimeDirectory(dist, integrity);
const blobs = new Map(),
  revoked = new Set(),
  workers = [];
let sequence = 0;
class LocalURL extends URL {
  static createObjectURL(blob) {
    const id = `blob:offline-check-${++sequence}`;
    blobs.set(id, blob);
    return id;
  }
  static revokeObjectURL(url) {
    revoked.add(url);
    blobs.delete(url);
  }
}
const denied = () => {
  throw Error("Unexpected filesystem or network access");
};
const globals = {
  Blob,
  URL: LocalURL,
  atob,
  btoa,
  crypto,
  performance,
  structuredClone,
  TextEncoder,
  TextDecoder,
  AbortController,
  DOMException,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  fetch: denied,
};
class LayoutWorker {
  terminated = false;
  constructor(url) {
    workers.push(this);
    const blob = blobs.get(url);
    assert.ok(blob, "Worker must use a locally owned Blob");
    this.self = {
      postMessage: (data) => {
        if (!this.terminated) this.onmessage?.({ data });
      },
    };
    this.ready = blob.text().then((source) => {
      assert.equal(hash(source), integrity.embeddedAssets.layout.sha256);
      runInNewContext(
        source,
        { ...globals, self: this.self },
        { timeout: 10000, displayErrors: false },
      );
    });
  }
  postMessage(data) {
    void this.ready
      .then(() => {
        if (!this.terminated) this.self.onmessage({ data });
      })
      .catch((error) => {
        if (!this.terminated) this.onerror?.(error);
      });
  }
  terminate() {
    this.terminated = true;
  }
}
class PluginDouble {
  manifest = {}; // No plugin directory is supplied: assets must be self-contained.
  constructor(app) {
    this.app = app;
  }
  async loadData() {
    return {};
  }
  registerView() {}
  addRibbonIcon() {}
  addCommand() {}
  addSettingTab() {}
  register() {}
  registerEvent() {}
}
const notices = [];
const host = {
  Plugin: PluginDouble,
  ItemView: class {},
  PluginSettingTab: class {},
  Setting: class {},
  TFile: class {},
  Keymap: {},
  Modal: class {},
  Menu: class {},
  Notice: class {
    constructor(message) {
      notices.push(message);
    }
  },
};
const app = {
  workspace: {
    on: () => ({}),
    onLayoutReady() {},
    getLeavesOfType: () => [],
    detachLeavesOfType() {},
  },
  metadataCache: { on: () => ({}) },
  vault: { on: () => ({}), adapter: new Proxy({}, { get: denied }) },
};
const module = { exports: {} };
const context = {
  ...globals,
  Worker: LayoutWorker,
  module,
  exports: module.exports,
  // Solid registers delegated event listeners when the module is evaluated.
  // No elements are created and no view is mounted in this non-DOM check.
  document: { addEventListener() {}, removeEventListener() {} },
  require: (id) => {
    if (id === "obsidian") return host;
    throw Error("Unexpected external module: " + id);
  },
};
context.window = context;
try {
  runInNewContext(await readFile(path.join(dist, "main.js"), "utf8"), context, {
    timeout: 10000,
    displayErrors: false,
  });
} catch (error) {
  // Do not dump the minified protected bundle as a source excerpt in logs.
  throw Error("Bundle evaluation failed: " + error.message);
}
const Plugin = module.exports.default;
const first = new Plugin(app);
await first.onload();
assert.equal(
  first.ready,
  true,
  "Bundled plugin failed to load: " + notices.join("; "),
);
assert.equal(blobs.size, 3);
await first.runtime.load();
assert.equal(blobs.size, 3, "Repeated load must not allocate new resources");
const observedHashes = await Promise.all(
  [...blobs.values()].map(async (blob) =>
    hash(Buffer.from(await blob.arrayBuffer())),
  ),
);
for (const [index, role] of ["worker", "wasm", "layout"].entries())
  assert.equal(
    observedHashes[index],
    integrity.embeddedAssets[role].sha256,
    `Incorrect bytes assigned to ${role}`,
  );
const compiled = await WebAssembly.compile(embedded.wasm);
assert.ok(
  WebAssembly.Module.exports(compiled).some(
    (x) => x.name === "kn_world_step_cached",
  ),
);

const graph = {
  schemaVersion: "obsidian-local-1",
  topicMaps: [],
  nodes: ["入口", "科学/光", "生活/光"].map((title, i) => ({
    id: `fixture-${i}`,
    slug: `fixture-${i}`,
    title,
    domain: "合成验证",
    tags: [],
    mocs: [],
    featured: false,
    isMoc: i === 0,
    hasTopicMap: false,
    summary: "",
    structuralRole: i === 0 ? "moc" : "regular",
    navigationReasons: [],
    readingMinutes: 0,
    incomingLinkCount: i === 0 ? 0 : 1,
    outgoingLinkCount: i === 0 ? 2 : 0,
  })),
  edges: [1, 2].map((i) => ({
    id: `edge-${i}`,
    source: "fixture-0",
    target: `fixture-${i}`,
    kind: "wiki",
    label: "真实合成连接",
  })),
};
const prepared = await first.runtime.prepare(
  graph,
  new AbortController().signal,
);
assert.equal(prepared.seed.length, 3);
assert.ok(workers.every((worker) => worker.terminated));
const controller = new AbortController();
const pending = first.runtime.prepare(graph, controller.signal);
controller.abort();
await assert.rejects(pending, (error) => error.name === "AbortError");
assert.ok(workers.every((worker) => worker.terminated));
const second = new Plugin(app);
await second.onload();
assert.equal(second.ready, true);
assert.equal(blobs.size, 6);
first.onunload();
assert.equal(blobs.size, 3);
await assert.rejects(first.runtime.load(), /已卸载/);
await assert.rejects(
  first.runtime.prepare(graph, new AbortController().signal),
  /尚未就绪/,
);
second.onunload();
second.onunload();
assert.equal(blobs.size, 0);
assert.equal(revoked.size, 6);
assert.equal(notices.length, 0);
const report = {
  at: new Date().toISOString(),
  atlas: integrity.atlas,
  runtimeFiles: Object.keys(integrity.files),
  loadedActualBundle: true,
  host: "Node VM with Obsidian host double, no UI",
  filesystemAndNetworkForbidden: true,
  embeddedBytesMatch: true,
  wasmCompiled: true,
  layoutSeedCount: prepared.seed.length,
  cancelledWorkerTerminated: true,
  independentOwners: true,
  remainingBlobUrls: blobs.size,
  realObsidianValidated: false,
  browserWorkerOrGpuValidated: false,
};
await writeFile(
  path.join(root, "outputs/installed-runtime-check.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
