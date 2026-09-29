import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSettings } from "../src/settings.ts";
import { normalizeViewOptions, restoreViewState } from "../src/view-state.ts";

test("legacy workspace state inherits a copy of existing shared defaults", () => {
  const settings = normalizeSettings({
    query: "tag:数学",
    depth: 3,
    follow: false,
  });
  const restored = restoreViewState(
    { local: true, centerPath: "中文/笔记.md" },
    settings,
  );
  assert.equal(restored.local, true);
  assert.equal(restored.centerPath, "中文/笔记.md");
  assert.equal(restored.options.query, "tag:数学");
  assert.equal(restored.options.depth, 3);
  restored.options.query = "path:另外";
  assert.equal(settings.query, "tag:数学");
});

test("two restored views have independent options and round trip through JSON", () => {
  const stored = {
    local: true,
    centerPath: "A.md",
    options: {
      query: "content:光",
      depth: 4,
      direction: "incoming",
      follow: false,
    },
  };
  const first = restoreViewState(stored);
  const second = restoreViewState(stored);
  first.options.depth = 0;
  first.options.query = "tag:另一项";
  assert.equal(second.options.depth, 4);
  assert.equal(second.options.query, "content:光");
  assert.deepEqual(
    restoreViewState(JSON.parse(JSON.stringify(second))),
    second,
  );
  assert.equal(stored.options.depth, 4);
});

test("invalid values fall back without losing valid false/zero/empty options", () => {
  const defaults = normalizeViewOptions({
    tags: true,
    query: "旧条件",
    depth: 5,
  });
  const restored = normalizeViewOptions(
    { tags: false, query: "", depth: 0 },
    defaults,
  );
  assert.equal(restored.tags, false);
  assert.equal(restored.query, "");
  assert.equal(restored.depth, 0);
  assert.equal(
    normalizeViewOptions(
      { depth: NaN, direction: "bad", tags: "false" },
      defaults,
    ).depth,
    5,
  );
  assert.equal(normalizeViewOptions({ depth: 100 }).depth, 20);
  assert.equal(restoreViewState(null).local, false);
  assert.equal(restoreViewState({ centerPath: 42 }).centerPath, "");
});

test("workspace state whitelists preferences and excludes content/graph/global settings", () => {
  const restored = restoreViewState({
    local: true,
    centerPath: "A.md",
    body: "private body",
    graph: { nodes: [] },
    options: {
      query: "path:A",
      text: "private body",
      exclusions: ["path:B"],
      groups: [{ query: "x", color: "#112233" }],
    },
  });
  assert.deepEqual(Object.keys(restored).sort(), [
    "centerPath",
    "local",
    "options",
  ]);
  assert.equal("text" in restored.options, false);
  assert.equal("exclusions" in restored.options, false);
  assert.equal("groups" in restored.options, false);
  assert.equal(JSON.stringify(restored).includes("private body"), false);
});

test("inherited options are not trusted workspace values", () => {
  assert.equal(
    normalizeViewOptions(Object.create({ query: "inherited", tags: true }))
      .query,
    "",
  );
  assert.equal(normalizeViewOptions(Object.create({ tags: true })).tags, false);
});
