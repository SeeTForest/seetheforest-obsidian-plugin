import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { buildGraph, type Snapshot } from "../src/graph.ts";

// Exercise the real plugin/controller against a deliberately small host double.
// This is not an Electron, DOM-layout, GPU or actual Obsidian installation test.
class ElementDouble {
  children: ElementDouble[] = [];
  events = new Map<string, () => void>();
  settings = new Map<string, ControlDouble>();
  value = "";
  text = "";
  parentElement?: ElementDouble;
  constructor(
    public tag = "div",
    public cls = "",
  ) {}
  empty() {
    this.children = [];
  }
  addClass(_cls: string) {}
  setAttribute(_key: string, _value: string) {}
  hasAttribute(_key: string) {
    return false;
  }
  setText(text: string) {
    this.text = text;
  }
  createDiv(options: { cls?: string } = {}) {
    return this.createEl("div", options);
  }
  createEl(tag: string, options: { cls?: string; text?: string } = {}) {
    const child = new ElementDouble(tag, options.cls);
    child.parentElement = this;
    child.text = options.text ?? "";
    this.children.push(child);
    return child;
  }
  addEventListener(type: string, callback: () => void) {
    this.events.set(type, callback);
  }
  find(predicate: (el: ElementDouble) => boolean): ElementDouble | undefined {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
  }
}
class ControlDouble {
  value: unknown;
  change: (value: any) => void = () => {};
  setValue(value: unknown) {
    this.value = value;
    return this;
  }
  onChange(callback: (value: any) => void) {
    this.change = callback;
    return this;
  }
  setLimits(..._args: number[]) {
    return this;
  }
  setDynamicTooltip() {
    return this;
  }
  addOptions(_options: unknown) {
    return this;
  }
}
class SettingDouble {
  name = "";
  constructor(private container: ElementDouble) {}
  setName(name: string) {
    this.name = name;
    return this;
  }
  addToggle(callback: (control: ControlDouble) => void) {
    return this.add(callback);
  }
  addSlider(callback: (control: ControlDouble) => void) {
    return this.add(callback);
  }
  addDropdown(callback: (control: ControlDouble) => void) {
    return this.add(callback);
  }
  private add(callback: (control: ControlDouble) => void) {
    const control = new ControlDouble();
    this.container.settings.set(this.name, control);
    callback(control);
    return this;
  }
}
class PluginDouble {
  factory!: (leaf: any) => any;
  saved: unknown[] = [];
  manifest = {};
  constructor(public app: any) {}
  async loadData() {
    return { settings: { query: "", depth: 1 } };
  }
  async saveData(data: unknown) {
    this.saved.push(data);
  }
  registerView(_type: string, factory: (leaf: any) => any) {
    this.factory = factory;
  }
  addRibbonIcon() {}
  addCommand() {}
  addSettingTab() {}
  register() {}
  registerEvent() {}
}
class ViewDouble {
  contentEl = new ElementDouble();
  app: any;
  constructor(public leaf: any) {
    this.app = leaf.app;
  }
  async setState() {}
  registerDomEvent(el: ElementDouble, type: string, callback: () => void) {
    el.events.set(type, callback);
  }
}
class RuntimeDouble {
  signals: AbortSignal[] = [];
  async load() {}
  prepare(_graph: unknown, signal: AbortSignal) {
    this.signals.push(signal);
    return new Promise<never>(() => {});
  }
  dispose() {}
}
const snapshot: Snapshot = {
  files: [
    {
      path: "A.md",
      title: "A",
      markdown: true,
      tags: [],
      properties: {},
      text: "光",
    },
  ],
  resolved: {},
  unresolved: {},
};
const bundled = await build({
  entryPoints: [fileURLToPath(new URL("../src/main.ts", import.meta.url))],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  target: "node24",
  external: ["obsidian", "./atlas-adapter", "./vault-adapter"],
});
async function fixture() {
  const leaves: any[] = [];
  const reads: boolean[] = [];
  let layoutSaves = 0;
  const app = {
    workspace: {
      getLeavesOfType: () => leaves,
      on: () => ({}),
      onLayoutReady: () => {},
      requestSaveLayout: () => {
        layoutSaves++;
      },
      detachLeavesOfType: () => {},
    },
    metadataCache: { on: () => ({}) },
    vault: { on: () => ({}) },
  };
  const host = {
    Plugin: PluginDouble,
    ItemView: ViewDouble,
    PluginSettingTab: class {},
    Setting: SettingDouble,
    TFile: class {},
    Keymap: {},
    Notice: class {},
    Modal: class {},
    Menu: class {},
  };
  const module = { exports: {} as { default?: any } };
  const requireDouble = (id: string) => {
    if (id === "obsidian") return host;
    if (id === "./atlas-adapter") return { AtlasRuntime: RuntimeDouble };
    if (id === "./vault-adapter")
      return {
        readSnapshot: async (_app: unknown, include: boolean) => {
          reads.push(include);
          return structuredClone(snapshot);
        },
      };
    throw Error(`Unexpected runtime dependency: ${id}`);
  };
  new Function("require", "module", "exports", bundled.outputFiles[0]!.text)(
    requireDouble,
    module,
    module.exports,
  );
  const plugin = new module.exports.default(app);
  await plugin.onload();
  plugin.index = buildGraph(snapshot, plugin.ids);
  async function view(state: Record<string, unknown> = {}) {
    const leaf: any = { app };
    leaf.view = plugin.factory(leaf);
    leaves.push(leaf);
    await leaf.view.onOpen();
    await leaf.view.setState(state, {});
    return leaf.view;
  }
  return { plugin, view, reads, layoutSaves: () => layoutSaves };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 260));
const search = (view: any): ElementDouble =>
  view.contentEl.find((el: ElementDouble) => el.tag === "input")!;
const filters = (view: any): ElementDouble =>
  view.contentEl.find((el: ElementDouble) => el.cls === "stf-filters")!;

test("real view events isolate filters, depth and follow across panels", async () => {
  const f = await fixture();
  try {
    const a = await f.view({ local: true, centerPath: "A.md" });
    const b = await f.view({ local: true, centerPath: "B.md" });
    filters(a).settings.get("标签")!.change(true);
    filters(a).settings.get("局部关系深度")!.change(4);
    filters(a).settings.get("局部图跟随当前笔记")!.change(false);
    a.follow("C.md");
    b.follow("C.md");
    assert.equal(a.getState().options.tags, true);
    assert.equal(b.getState().options.tags, false);
    assert.equal(b.getState().options.depth, 1);
    assert.equal(a.getState().centerPath, "A.md");
    assert.equal(b.getState().centerPath, "C.md");
    assert.equal(f.plugin.settings.depth, 1);
    assert.ok(f.layoutSaves() >= 4);
  } finally {
    f.plugin.onunload();
  }
});

test("restored controls and tag navigation stay local; indexing sees all views' text needs", async () => {
  const f = await fixture();
  try {
    const a = await f.view({ options: { query: "content:光", depth: 3 } });
    const b = await f.view();
    assert.equal(search(a).value, "content:光");
    assert.equal(filters(a).settings.get("局部关系深度")!.value, 3);
    const pending = f.plugin.runtime.signals.at(-1)!;
    search(b).value = "path:A";
    search(b).events.get("input")!();
    assert.equal(pending.aborted, true);
    search(b).value = "";
    search(b).events.get("input")!();
    await tick();
    assert.equal(f.reads.at(-1), true); // a still needs note content
    assert.equal(search(a).value, "content:光");
    f.plugin.index.targets.set("tag:test", { kind: "tag", tag: "#数学" });
    await b.openNode("tag:test", {});
    assert.equal(search(b).value, "tag:#数学");
    assert.equal(search(a).value, "content:光");
    assert.equal(f.plugin.settings.query, "");
    for (const view of [a, b]) {
      search(view).value = "";
      search(view).events.get("input")!();
    }
    await tick();
    assert.equal(f.reads.at(-1), false); // no remaining view needs note content
  } finally {
    f.plugin.onunload();
  }
});

test("workspace round trip restores a view without sharing its mutable state", async () => {
  const f = await fixture();
  try {
    const a = await f.view({
      local: true,
      centerPath: "目录/A.md",
      options: { follow: false, depth: 2 },
    });
    a.rename("目录", "新目录");
    const saved = a.getState();
    const b = await f.view(JSON.parse(JSON.stringify(saved)));
    saved.options.depth = 19;
    assert.equal(a.getState().options.depth, 2);
    assert.equal(b.getState().options.depth, 2);
    assert.equal(b.getState().centerPath, "新目录/A.md");
    assert.equal(b.getState().options.follow, false);
    assert.ok(f.layoutSaves() > 0);
  } finally {
    f.plugin.onunload();
  }
});
