/** Build-time bytes from the verified release, not remote URLs or source code. */
export interface EmbeddedRuntimeAssets {
  worker: string;
  wasm: string;
  layout: string;
}

export interface RuntimeAssetUrls {
  workerUrl: string;
  wasmUrl: string;
  layoutUrl: string;
  dispose(): void;
}

export function createRuntimeAssetUrls(
  assets: EmbeddedRuntimeAssets,
): RuntimeAssetUrls {
  const urls: string[] = [];
  const dispose = () => {
    urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  };
  const make = (encoded: string, type: string) => {
    if (!encoded) throw new Error("插件缺少内嵌运行资源。");
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    urls.push(url);
    return url;
  };
  try {
    return {
      workerUrl: make(assets.worker, "text/javascript"),
      wasmUrl: make(assets.wasm, "application/wasm"),
      layoutUrl: make(assets.layout, "text/javascript"),
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
