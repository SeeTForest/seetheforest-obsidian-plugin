import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

test("layout timeout and cleanup use the same browser window timer namespace", async () => {
  const bundled = await build({
    entryPoints: [fileURLToPath(new URL("../src/atlas-adapter.ts", import.meta.url))],
    bundle: true, write: false, platform: "node", format: "cjs", target: "node24",
    external: ["solid-js", "solid-js/web", "@seetheforest/atlas/solid", "./runtime-assets"],
    define: { __ATLAS_ASSETS__: "{}" },
  });
  for (const finish of ["success", "abort", "timeout", "worker-error"] as const) {
    const timers = new Map<number, () => void>();
    let cleared = 0;
    let terminated = 0;
    let worker: any;
    const timerWindow = {
      setTimeout(callback: () => void, delay: number) { assert.equal(delay, 120000); timers.set(41, callback); return 41; },
      clearTimeout(id: number) { assert.equal(id, 41); cleared++; timers.delete(id); },
    };
    class WorkerDouble {
      constructor() { worker = this; }
      postMessage() {}
      terminate() { terminated++; }
    }
    const module = { exports: {} as any };
    const requireDouble = (id: string) => {
      if (id === "solid-js" || id === "solid-js/web") return {};
      if (id === "@seetheforest/atlas/solid") return { ATLAS_HOST_API_VERSION: 1 };
      if (id === "./runtime-assets") return { createRuntimeAssetUrls: () => ({ layoutUrl: "blob:layout", dispose() {} }) };
      throw Error(id);
    };
    const forbiddenGlobalTimer = () => { throw Error("Unexpected non-window timer"); };
    new Function("require", "module", "exports", "window", "Worker", "setTimeout", "clearTimeout", bundled.outputFiles[0]!.text)(
      requireDouble, module, module.exports, timerWindow, WorkerDouble, forbiddenGlobalTimer, forbiddenGlobalTimer,
    );
    const runtime = new module.exports.AtlasRuntime();
    await runtime.load();
    const controller = new AbortController();
    const preparing = runtime.prepare({ nodes: [], edges: [] }, controller.signal);
    if (finish === "success") {
      worker.onmessage({ data: { view: {}, seed: [] } });
      assert.deepEqual(await preparing, { view: {}, seed: [] });
    } else {
      const rejected = assert.rejects(preparing, finish === "abort" ? /Cancelled/ : finish === "timeout" ? /超时/ : /线程不可用/);
      if (finish === "abort") controller.abort();
      else if (finish === "timeout") timers.get(41)!();
      else worker.onerror();
      await rejected;
    }
    controller.abort();
    assert.equal(terminated, 1);
    assert.equal(cleared, 1);
    assert.equal(timers.size, 0);
    runtime.dispose();
  }
});

test("Atlas adapter opts into selection-only nodes and delegates explicit reading unchanged", async () => {
  const bundled = await build({
    entryPoints: [
      fileURLToPath(new URL("../src/atlas-adapter.ts", import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    target: "node24",
    external: [
      "solid-js",
      "solid-js/web",
      "@seetheforest/atlas/solid",
      "./runtime-assets",
    ],
    define: { __ATLAS_ASSETS__: "{}" },
  });
  let captured: any;
  let opened: unknown;
  let context: unknown;
  let disposed = 0;
  const module = { exports: {} as any };
  const requireDouble = (id: string) => {
    if (id === "solid-js")
      return {
        createSignal: (initial: unknown) => {
          let value = initial;
          return [
            () => value,
            (next: unknown) => {
              value = next;
            },
          ];
        },
        createComponent: (_component: unknown, props: unknown) => {
          captured = props;
          return {};
        },
      };
    if (id === "solid-js/web")
      return {
        render: (callback: () => void) => {
          callback();
          return () => {
            disposed++;
          };
        },
      };
    if (id === "@seetheforest/atlas/solid")
      return { ATLAS_HOST_API_VERSION: 1, KnowledgeAtlas: () => {} };
    if (id === "./runtime-assets")
      return {
        createRuntimeAssetUrls: () => ({
          workerUrl: "blob:worker",
          wasmUrl: "blob:wasm",
          layoutUrl: "blob:layout",
          dispose() {},
        }),
      };
    throw Error(`Unexpected dependency: ${id}`);
  };
  new Function("require", "module", "exports", bundled.outputFiles[0]!.text)(
    requireDouble,
    module,
    module.exports,
  );
  const runtime = new module.exports.AtlasRuntime();
  await runtime.load();
  const graph = { nodes: [], edges: [] };
  const mounted = runtime.mount(
    {},
    graph,
    { view: {}, seed: [] },
    {},
    (node: unknown, event: unknown) => {
      opened = [node, event];
    },
    (node: unknown, event: unknown) => {
      context = [node, event];
    },
  );
  assert.equal(captured.host.nodeActivation, "select");
  assert.equal(opened, undefined);
  const node = { id: "note:exact-id" };
  const event = { ctrlKey: true };
  captured.host.openNode(node, event);
  assert.deepEqual(opened, [node, event]);
  captured.host.contextMenu(node, event);
  assert.deepEqual(context, [node, event]);
  assert.equal(captured.host.nodeHref(node), "#note%3Aexact-id");
  mounted.update(graph, [], {});
  assert.equal(captured.host.nodeActivation, "select");
  mounted.dispose();
  runtime.dispose();
  assert.equal(disposed, 1);
});
