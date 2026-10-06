import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  buildGraph,
  Identities,
  projectGraph,
  type Snapshot,
} from "../src/graph.ts";
import { DEFAULTS } from "../src/settings.ts";
const root = fileURLToPath(new URL("../", import.meta.url));
const lock = JSON.parse(await readFile(path.join(root, "vendor/atlas.lock.json"), "utf8"));
const { verifyAtlas, hash } = await import(new URL("./atlas-verification.mjs", import.meta.url).href);
const verified = await verifyAtlas(...["atlas.tgz", "atlas.sig", "atlas-public.pem"].map((name) => path.join(root, "vendor", name)), lock);
for (const [name, digest] of Object.entries(verified.protection.files))
  if (hash(await readFile(path.join(root, "node_modules/@seetheforest/atlas", name))) !== digest)
    throw Error("Benchmark installed Atlas differs from the verified input");
const { selectForestAtlasView, compileForestLayoutSeed } = await import("@seetheforest/atlas");
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
await mkdir(path.join(root, "outputs"), { recursive: true });
await writeFile(
  path.join(root, "outputs/synthetic-performance.json"),
  JSON.stringify(
    {
      environment: { node: process.version, platform: process.platform },
      atlas: { version: lock.version, sha256: lock.sha256 },
      scope: "Synthetic data API measurements; not Obsidian, no GPU/frame-rate or large-Vault acceptance claim",
      rows,
    },
    null,
    2,
  ),
);
