import { createComponent, createSignal } from "solid-js";
import { render } from "solid-js/web";
import * as atlas from "@seetheforest/atlas/solid";
import type { AtlasView, ForestLayoutSeed } from "@seetheforest/atlas";
import type { App, PluginManifest } from "obsidian";
import type { ContentGraph, GraphNode } from "./graph";
import type { JSX } from "solid-js";

declare const __ATLAS_ASSETS__: {
  worker: string;
  wasm: string;
  layout: string;
};
interface HostRuntime {
  ATLAS_HOST_API_VERSION: number;
  KnowledgeAtlas(props: {
    initialView: AtlasView;
    graph: ContentGraph;
    layoutSeed: ForestLayoutSeed[];
    immersive: boolean;
    host: {
      runtimeAssets: { workerUrl: string; wasmUrl: string };
      openNode(node: GraphNode, event: MouseEvent | KeyboardEvent): void;
      nodeHref(node: GraphNode): string;
      contextMenu(node: GraphNode, event: MouseEvent): void;
      nodeColors: Record<string, string>;
    };
  }): JSX.Element;
}

/** The only runtime Atlas import. No upstream source links or artifact rewriting. */
export class AtlasRuntime {
  private disposed = false;
  private urls: string[] = [];
  private assets?: { workerUrl: string; wasmUrl: string };
  private layoutUrl = "";
  private api = atlas as unknown as HostRuntime;
  async load(app: App, manifest: PluginManifest): Promise<void> {
    if (this.api.ATLAS_HOST_API_VERSION !== 1)
      throw new Error(
        "Atlas 签名制品不含本地宿主接口 v1，请安装匹配版本的完整插件包。",
      );
    const directory = manifest.dir;
    if (!directory) throw new Error("无法确定插件资源目录。");
    try {
      const make = async (path: string, type: string) => {
        const bytes = await app.vault.adapter.readBinary(
          `${directory}/${path}`,
        );
        if (this.disposed) throw new Error("Atlas 已卸载。");
        const url = URL.createObjectURL(new Blob([bytes], { type }));
        this.urls.push(url);
        return url;
      };
      const workerUrl = await make(__ATLAS_ASSETS__.worker, "text/javascript");
      const wasmUrl = await make(__ATLAS_ASSETS__.wasm, "application/wasm");
      this.layoutUrl = await make(__ATLAS_ASSETS__.layout, "text/javascript");
      this.assets = { workerUrl, wasmUrl };
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  prepare(
    graph: ContentGraph,
    signal: AbortSignal,
  ): Promise<{ view: AtlasView; seed: ForestLayoutSeed[] }> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Cancelled", "AbortError"));
        return;
      }
      const worker = new Worker(this.layoutUrl, {
        name: "seetheforest-layout",
      });
      const cleanup = () => {
        clearTimeout(timeout);
        worker.terminate();
        signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("布局计算超时，请缩小可见范围后重试。"));
      }, 120000);
      signal.addEventListener("abort", abort, { once: true });
      worker.onmessage = (event) => {
        cleanup();
        if (event.data.error) reject(new Error(event.data.error));
        else resolve(event.data);
      };
      worker.onerror = () => {
        cleanup();
        reject(new Error("Atlas 布局线程不可用，请重试。"));
      };
      try {
        worker.postMessage(graph);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
  mount(
    element: HTMLElement,
    graph: ContentGraph,
    prepared: { view: AtlasView; seed: ForestLayoutSeed[] },
    colors: Record<string, string>,
    openNode: (node: GraphNode, event: MouseEvent | KeyboardEvent) => void,
    contextMenu: (node: GraphNode, event: MouseEvent) => void,
  ) {
    if (!this.assets) throw new Error("Atlas 运行资源尚未就绪。");
    const [source, update] = createSignal({
      graph,
      seed: prepared.seed,
      colors,
    });
    const initialView = prepared.view;
    const dispose = render(
      () =>
        createComponent(this.api.KnowledgeAtlas, {
          initialView,
          get graph() {
            return source().graph;
          },
          get layoutSeed() {
            return source().seed;
          },
          immersive: true,
          host: {
            runtimeAssets: this.assets!,
            openNode,
            nodeHref: (node) => `#${encodeURIComponent(node.id)}`,
            contextMenu,
            get nodeColors() {
              return source().colors;
            },
          },
        }),
      element,
    );
    return {
      update: (
        next: ContentGraph,
        seed: ForestLayoutSeed[],
        colors: Record<string, string>,
      ) => update({ graph: next, seed, colors }),
      dispose,
    };
  }
  dispose(): void {
    this.disposed = true;
    this.assets = undefined;
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls = [];
  }
}
