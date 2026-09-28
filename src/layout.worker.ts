import {
  selectForestAtlasView,
  compileForestLayoutSeed,
} from "@seetheforest/atlas";
import type { ContentGraph } from "./graph";
// This Worker consumes the verified data API. It contains no host physics.
self.onmessage = (event: MessageEvent<ContentGraph>) => {
  try {
    const view = selectForestAtlasView(event.data);
    const seed = compileForestLayoutSeed(view);
    self.postMessage({ view, seed });
  } catch {
    self.postMessage({ error: "Atlas 布局准备失败，请重试。" });
  }
};
