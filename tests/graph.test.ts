import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGraph,
  Identities,
  projectGraph,
  type Snapshot,
  type VaultEntry,
} from "../src/graph.ts";
import { DEFAULTS, normalizeSettings } from "../src/settings.ts";
import { compileSearch } from "../src/search.ts";

const entry = (
  path: string,
  properties: Record<string, unknown> = {},
): VaultEntry => ({
  path,
  title: path.split("/").at(-1)!,
  markdown: path.endsWith(".md"),
  tags: [],
  properties,
});
function fixture(): Snapshot {
  return {
    files: [
      entry("中文/起点.md", { publish: false }),
      entry("A/同名.md"),
      entry("B/同名.md"),
      entry("孤岛.md"),
      entry("图.png"),
    ],
    resolved: {
      "中文/起点.md": { "A/同名.md": 3, "图.png": 1 },
      "A/同名.md": { "B/同名.md": 1 },
    },
    unresolved: {
      "中文/起点.md": { "../缺失#标题": 2 },
      "B/同名.md": { "../缺失#标题": 1 },
    },
  };
}
const ids = () => {
  let counter = 0;
  return new Identities({}, () => String(++counter));
};
test("retains publish:false and exact MetadataCache target identity, aggregates occurrences without invented edges", () => {
  const identity = ids(),
    index = buildGraph(fixture(), identity);
  assert.equal(
    index.graph.nodes.filter((n) => index.targets.get(n.id)?.kind === "file")
      .length,
    5,
  );
  const source = identity.get("中文/起点.md"),
    target = identity.get("A/同名.md");
  assert.equal(index.occurrences.get(JSON.stringify([source, target])), 3);
  assert.equal(
    index.graph.nodes.find((n) => n.id === target)?.incomingLinkCount,
    1,
  );
  assert.notEqual(target, identity.get("B/同名.md"));
  assert.equal(
    index.graph.nodes.filter(
      (n) => index.targets.get(n.id)?.kind === "unresolved",
    ).length,
    2,
  );
});
test("file and folder rename preserve identity, deletion and recreation do not", () => {
  const identity = ids();
  const first = identity.get("目录/旧.md");
  identity.rename("目录", "新目录");
  assert.equal(identity.get("新目录/旧.md"), first);
  identity.rename("新目录/旧.md", "新目录/新.md");
  assert.equal(identity.get("新目录/新.md"), first);
  identity.remove("新目录");
  assert.notEqual(identity.get("新目录/新.md"), first);
});
test("restores only valid identity data without prototype mutation", () => {
  const identity = new Identities(
    JSON.parse('{"__proto__":"note:test","a.md":"note:1","b.md":23}'),
  );
  assert.equal(Object.getPrototypeOf(identity.paths), null);
  assert.equal(identity.paths["b.md"], undefined);
  const corrupt = new Identities({ "a.md": "note:1", "b.md": "note:1" });
  assert.notEqual(corrupt.get("a.md"), corrupt.get("b.md"));
});
test("default options exclude synthetic tags/unresolved/attachments, not unpublished notes", () => {
  const snapshot = fixture();
  snapshot.files[0]!.tags = ["#一", "#一"];
  const index = buildGraph(snapshot, ids());
  const graph = projectGraph(index, DEFAULTS, () => true);
  assert.equal(graph.nodes.length, 4);
  assert.equal(graph.edges.length, 2);
  assert.equal(
    projectGraph(index, { ...DEFAULTS, orphans: false }, () => true).nodes
      .length,
    3,
  );
  assert.equal(
    projectGraph(
      index,
      { ...DEFAULTS, tags: true, attachments: true, existingOnly: false },
      () => true,
    ).nodes.length,
    8,
  );
});
test("local depth and incoming/outgoing direction traverse only actual relationships", () => {
  const identity = ids(),
    index = buildGraph(fixture(), identity),
    center = identity.get("A/同名.md");
  assert.equal(
    projectGraph(index, { ...DEFAULTS, depth: 0 }, () => true, center).nodes
      .length,
    1,
  );
  assert.equal(
    projectGraph(index, { ...DEFAULTS, depth: 1 }, () => true, center).nodes
      .length,
    3,
  );
  const outgoing = projectGraph(
    index,
    { ...DEFAULTS, direction: "outgoing" },
    () => true,
    center,
  );
  assert.deepEqual(
    new Set(outgoing.nodes.map((n) => n.id)),
    new Set([center, identity.get("B/同名.md")]),
  );
  assert.equal(
    projectGraph(index, DEFAULTS, () => true, "deleted-center").nodes.length,
    0,
  );
});
test("filters cannot leave dangling edges or secretly cap a 4096-node graph", () => {
  const snapshot: Snapshot = {
    files: Array.from({ length: 4096 }, (_, i) => entry(`${i}.md`)),
    resolved: {},
    unresolved: {},
  };
  for (let i = 1; i < 4096; i++)
    snapshot.resolved[`${i}.md`] = { [`${i - 1}.md`]: 1 };
  const index = buildGraph(snapshot, ids());
  const full = projectGraph(index, DEFAULTS, () => true);
  assert.equal(full.nodes.length, 4096);
  assert.equal(full.edges.length, 4095);
  const filtered = projectGraph(index, DEFAULTS, (n) => n.path === "0.md");
  assert.equal(filtered.nodes.length, 1);
  assert.equal(filtered.edges.length, 0);
});
test("search handles Chinese paths, quotes, nested tags, negation, OR and properties", () => {
  const file = {
    ...entry("中文/起点.md", { status: "草稿" }),
    tags: ["#学习/物理"],
    text: "磁力与 gravity waves",
  };
  for (const query of [
    "path:中文 tag:学习",
    '"gravity waves" -tag:不存在',
    "(file:起点 OR file:错误) [status:草稿]",
    "content:磁力",
  ])
    assert.equal(compileSearch(query)(file), true, query);
  assert.equal(compileSearch("-path:中文")(file), false);
  assert.throws(() => compileSearch("line:磁力"), /暂不支持/);
  assert.throws(() => compileSearch("(path:中文"), /括号/);
  assert.throws(() => compileSearch('"unclosed'), /引号/);
  assert.throws(() => compileSearch("OR"), /缺少/);
});
test("settings survive invalid data with finite bounded defaults", () => {
  assert.deepEqual(normalizeSettings(null), DEFAULTS);
  assert.equal(normalizeSettings({ depth: Infinity }).depth, 1);
  assert.equal(normalizeSettings({ depth: 99 }).depth, 20);
  assert.equal(normalizeSettings({ existingOnly: "false" }).existingOnly, true);
});
