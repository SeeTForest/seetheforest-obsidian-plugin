import { createComponent, createSignal } from "solid-js";
import { render } from "solid-js/web";
import * as atlas from "@seetheforest/atlas/solid";
import type { AtlasView, ForestLayoutSeed } from "@seetheforest/atlas";
import type { ContentGraph, GraphNode } from "./graph";
import type { JSX } from "solid-js";
import {
  createRuntimeAssetUrls,
  type EmbeddedRuntimeAssets,
  type RuntimeAssetUrls,
} from "./runtime-assets";

declare const __ATLAS_ASSETS__: EmbeddedRuntimeAssets;
interface HostRuntime {
  ATLAS_HOST_API_VERSION: number;
  KnowledgeAtlas(props: {
    initialView: AtlasView;
    graph: ContentGraph;
    layoutSeed: ForestLayoutSeed[];
    immersive: boolean;
    host: {
      nodeActivation: "select";
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
  private resources?: RuntimeAssetUrls;
  private assets?: { workerUrl: string; wasmUrl: string };
  private layoutUrl = "";
  private api = atlas as unknown as HostRuntime;
  async load(): Promise<void> {
    if (this.disposed) throw new Error("Atlas 已卸载。");
    if (this.resources) return;
    if (this.api.ATLAS_HOST_API_VERSION !== 1)
      throw new Error(
        "Atlas 签名制品不含本地宿主接口 v1，请安装匹配版本的完整插件包。",
      );
    this.resources = createRuntimeAssetUrls(__ATLAS_ASSETS__);
    this.layoutUrl = this.resources.layoutUrl;
    this.assets = {
      workerUrl: this.resources.workerUrl,
      wasmUrl: this.resources.wasmUrl,
    };
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
      if (this.disposed || !this.resources) {
        reject(new Error("Atlas 运行资源尚未就绪。"));
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
            // Node selection stays in Atlas; explicit reading links navigate.
            nodeActivation: "select",
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
    this.resources?.dispose();
    this.resources = undefined;
    this.layoutUrl = "";
  }
}
