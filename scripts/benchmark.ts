import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  selectForestAtlasView,
  compileForestLayoutSeed,
} from "@seetheforest/atlas";
import {
  buildGraph,
  Identities,
  projectGraph,
  type Snapshot,
} from "../src/graph.ts";
import { DEFAULTS } from "../src/settings.ts";
const rows = [];
for (const size of [50, 500, 4096]) {
  const snapshot: Snapshot = {
    files: Array.from({ length: size }, (_, i) => ({
      path: `Group${i % 8}/${i}.md`,
      title: `Synthetic ${i}`,
      markdown: true,
      tags: [],
      properties: {},
    })),
    resolved: {},
    unresolved: {},
  };
  for (let i = 1; i < size; i++)
    snapshot.resolved[snapshot.files[i]!.path] = {
      [snapshot.files[i - 1]!.path]: 1,
    };
  const start = performance.now();
  const graph = projectGraph(
    buildGraph(snapshot, new Identities()),
    DEFAULTS,
    () => true,
  );
  const ingestMs = performance.now() - start;
  const layoutStart = performance.now();
  const view = selectForestAtlasView(graph);
  const layoutMs = performance.now() - layoutStart;
  const seedStart = performance.now();
  const seed = compileForestLayoutSeed(view);
  const seedMs = performance.now() - seedStart;
  if (view.nodes.length !== size || seed.length !== size)
    throw Error("Node loss");
  const row = {
    size,
    edges: graph.edges.length,
    ingestMs: Math.round(ingestMs),
    layoutMs: Math.round(layoutMs),
    seedMs: Math.round(seedMs),
    heapMiB: Math.round(process.memoryUsage().heapUsed / 1048576),
  };
  rows.push(row);
  console.log(JSON.stringify(row));
}
await mkdir("outputs", { recursive: true });
await writeFile(
  "outputs/synthetic-performance.json",
  JSON.stringify(
    {
      environment:
        "Node 24, verified Atlas 0.1.6 data API; not Obsidian, no GPU/frame-rate claim",
      rows,
    },
    null,
    2,
  ),
);
