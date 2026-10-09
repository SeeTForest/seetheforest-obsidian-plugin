import { getAllTags, getLinkpath, type App } from "obsidian";
import type { Snapshot, VaultEntry } from "./graph";

/** MetadataCache owns Wiki/Markdown/alias/anchor/embed resolution. */
export async function readSnapshot(
  app: App,
  includeText: boolean,
  cancelled: () => boolean,
): Promise<Snapshot> {
  const files = app.vault.getFiles();
  const entries: VaultEntry[] = [];
  const linkKinds = Object.create(null) as NonNullable<Snapshot["linkKinds"]>;
  for (let offset = 0; offset < files.length; offset += 32) {
    if (cancelled()) throw new Error("snapshot-cancelled");
    const batch = await Promise.all(
      files.slice(offset, offset + 32).map(async (file) => {
        const markdown = file.extension.toLowerCase() === "md";
        const cache = app.metadataCache.getFileCache(file);
        if (markdown && !cache)
          throw new Error(
            "正在等待 Obsidian 完成笔记索引；索引就绪后会自动重试。",
          );
        if (cache)
          for (const link of [
            ...(cache.links ?? []),
            ...(cache.embeds ?? []),
            ...(cache.frontmatterLinks ?? []),
          ]) {
            const target = app.metadataCache.getFirstLinkpathDest(
              getLinkpath(link.link),
              file.path,
            );
            if (!target) continue;
            const pair = JSON.stringify([file.path, target.path]);
            const kind =
              link.original.startsWith("[[") || link.original.startsWith("![[")
                ? "wiki"
                : "markdown";
            if (!linkKinds[pair] || kind === "markdown") linkKinds[pair] = kind;
          }
        return {
          path: file.path,
          title: file.basename,
          markdown,
          tags: cache ? (getAllTags(cache) ?? []) : [],
          properties: cache?.frontmatter ?? {},
          ...(markdown && includeText
            ? { text: await app.vault.cachedRead(file) }
            : {}),
        };
      }),
    );
    entries.push(...batch);
    // Yield input time without relying on Electron / Node APIs.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }
  return {
    linkKinds,
    files: entries,
    resolved: structuredClone(app.metadataCache.resolvedLinks),
    unresolved: structuredClone(app.metadataCache.unresolvedLinks),
  };
}
