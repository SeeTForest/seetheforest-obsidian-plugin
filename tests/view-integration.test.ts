import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { buildGraph, type Snapshot } from "../src/graph.ts";
import { browserTimers } from "./browser-timers.ts";

// Exercise the real plugin/controller against a deliberately small host double.
// This is not an Electron, DOM-layout, GPU or actual Obsidian installation test.
class ElementDouble {
  children: ElementDouble[] = [];
  events = new Map<string, () => void>();
  settings = new Map<string, ControlDouble>();
  value = "";
  text = "";
  open = false;
  hidden = false;
  attributes: Record<string, string> = {};
  parentElement?: ElementDouble;
  ownerDocument = {};
  displayReady = false;
  querySelector() { return this.displayReady ? {} : null; }
  getBoundingClientRect() { return { left: 20, bottom: 80 }; }
  constructor(
    public tag = "div",
    public cls = "",
  ) {}
  empty() {
    this.children = [];
  }
  addClass(_cls: string) {}
  setAttribute(key: string, value: string) {
    this.attributes[key] = value;
  }
  hasAttribute(key: string) {
    return key === "open" ? this.open : key in this.attributes;
  }
  setText(text: string) {
    this.text = text;
  }
  createDiv(options: { cls?: string } = {}) {
    return this.createEl("div", options);
  }
  createSpan(options: { cls?: string; text?: string } = {}) {
    return this.createEl("span", options);
  }
  createEl(
    tag: string,
    options: {
      cls?: string;
      text?: string;
      attr?: Record<string, string>;
    } = {},
  ) {
    const child = new ElementDouble(tag, options.cls);
    child.parentElement = this;
    child.text = options.text ?? "";
    child.attributes = options.attr ?? {};
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
  setPlaceholder(_value: string) { return this; }
  setButtonText(_value: string) { return this; }
  onClick(callback: () => void) { this.change = callback; return this; }
}
class SettingDouble {
  name = "";
  constructor(private container: ElementDouble) {}
  setName(name: string) {
    this.name = name;
    return this;
  }
  setDesc(_value: string) { return this; }
  setHeading() { return this; }
  addTextArea(callback: (control: ControlDouble) => void) { return this.add(callback); }
  addText(callback: (control: ControlDouble) => void) { return this.add(callback); }
  addColorPicker(callback: (control: ControlDouble) => void) { return this.add(callback); }
  addButton(callback: (control: ControlDouble) => void) { return this.add(callback); }
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
  ribbons: Array<{ icon: string; title: string; callback: () => void }> = [];
  commands: Array<{ id: string; callback?: () => void }> = [];
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
  addRibbonIcon(icon: string, title: string, callback: () => void) {
    this.ribbons.push({ icon, title, callback });
  }
  addCommand(command: { id: string; callback?: () => void }) {
    this.commands.push(command);
  }
  settingTab: any;
  addSettingTab(tab: any) { this.settingTab = tab; }
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
class FileDouble {
  constructor(public path: string) {}
}
class MenuDouble {
  static opened: MenuDouble[] = [];
  items: Array<{ title: string; click?: () => void }> = [];
  position?: unknown;
  document?: unknown;
  addItem(callback: (item: any) => void) {
    const item = { title: "", click: undefined as (() => void) | undefined,
      setTitle(title: string) { this.title = title; return this; },
      onClick(click: () => void) { this.click = click; return this; } };
    callback(item);
    this.items.push(item);
    return this;
  }
  showAtMouseEvent(event: unknown) { this.position = event; MenuDouble.opened.push(this); }
  showAtPosition(position: unknown, doc: unknown) { this.position = position; this.document = doc; MenuDouble.opened.push(this); }
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
async function fixture(options: { modernSettings?: boolean; loadData?: () => Promise<unknown>; runtimeLoad?: () => Promise<void>; beforeLoad?: (plugin: any) => void } = {}) {
  const leaves: any[] = [];
  const reads: boolean[] = [];
  const notices: string[] = [];
  const menuEvents: unknown[][] = [];
  let layoutSaves = 0;
  const app = {
    workspace: {
      getLeavesOfType: () => leaves,
      on: () => ({}),
      trigger: (...args: unknown[]) => { menuEvents.push(args); },
      onLayoutReady: () => {},
      requestSaveLayout: () => {
        layoutSaves++;
      },
      detachLeavesOfType: () => {},
    },
    metadataCache: { on: () => ({}) },
    vault: { on: () => ({}), getAbstractFileByPath: (path: string) => new FileDouble(path) },
  };
  class LegacySettingsTab {
    containerEl = new ElementDouble();
    constructor(public app: unknown, public plugin: unknown) {}
  }
  class ModernSettingsTab extends LegacySettingsTab {
    renders = 0;
    getSettingDefinitions(): any[] { return []; }
    update() {
      this.renders++;
      this.containerEl.empty();
      for (const def of this.getSettingDefinitions()) {
        const row = new SettingDouble(this.containerEl).setName(def.name);
        if (def.desc) row.setDesc(def.desc);
        def.render(row);
      }
    }
  }
  const host = {
    Plugin: PluginDouble,
    ItemView: ViewDouble,
    PluginSettingTab: options.modernSettings ? ModernSettingsTab : LegacySettingsTab,
    Setting: SettingDouble,
    TFile: FileDouble,
    Keymap: {
      isModEvent: (event: { ctrlKey?: boolean }) =>
        event.ctrlKey ? "tab" : false,
    },
    Notice: class { constructor(message: string) { notices.push(message); } },
    Modal: class {},
    Menu: MenuDouble,
    requireApiVersion: (version: string) => {
      assert.equal(version, "1.13.0");
      return options.modernSettings === true;
    },
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
  new Function("require", "module", "exports", "window", bundled.outputFiles[0]!.text)(
    requireDouble,
    module,
    module.exports,
    browserTimers(),
  );
  const plugin = new module.exports.default(app);
  if (options.loadData) plugin.loadData = options.loadData;
  if (options.runtimeLoad) plugin.runtime.load = options.runtimeLoad;
  options.beforeLoad?.(plugin);
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
  return { plugin, view, reads, notices, menuEvents, layoutSaves: () => layoutSaves };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 260));

for (const modernSettings of [false, true]) {
  test(`settings search and persistence preserve the data envelope (modern=${modernSettings})`, async () => {
    const f = await fixture({ modernSettings });
    try {
      const tab = f.plugin.settingTab;
      const before = f.plugin.saved.length;
      const definitions = tab.getSettingDefinitions();
      assert.ok(definitions.some((d: any) => d.name === "排除条件"));
      assert.ok(definitions.some((d: any) => d.name === "添加颜色分组"));
      assert.equal(f.plugin.saved.length, before, "Indexing settings must be side-effect free");
      if (modernSettings) tab.update();
      else tab.display();
      assert.equal(tab.renders, modernSettings ? 1 : undefined);
      await tab.containerEl.settings.get("排除条件").change("path:archive\n\n tag:hidden ");
      assert.deepEqual(f.plugin.settings.exclusions, ["path:archive", "tag:hidden"]);
      assert.deepEqual(f.plugin.saved.at(-1).settings.exclusions, ["path:archive", "tag:hidden"]);
      assert.ok(f.plugin.saved.at(-1).identities, "Settings writes must not erase stable identities");
      await tab.containerEl.settings.get("添加颜色分组").change();
      assert.equal(f.plugin.settings.groups.length, 1);
      assert.ok(tab.getSettingDefinitions().some((d: any) => d.name === "分组 1"));
      await tab.containerEl.settings.get("分组 1").change(); // remove the group
      assert.equal(f.plugin.settings.groups.length, 0);
      await tab.containerEl.settings.get("恢复插件默认设置").change();
      assert.deepEqual(f.plugin.settings.exclusions, []);
    } finally { f.plugin.onunload(); }
  });
}

const search = (view: any): ElementDouble =>
  view.contentEl.find((el: ElementDouble) => el.tag === "input")!;
const filters = (view: any): ElementDouble =>
  view.contentEl.find((el: ElementDouble) => el.cls === "stf-filters")!;
const control = (view: any, name: string): ControlDouble =>
  filters(view)
    .find((el) => el.settings.has(name))!
    .settings.get(name)!;

test("large graph loading survives mount until readiness without losing nodes or resetting on identical refresh", async () => {
  const f = await fixture();
  try {
    const count = 4355;
    f.plugin.index = buildGraph({ files: Array.from({ length: count }, (_, i) => ({
      ...snapshot.files[0]!, path: `Synthetic/${i}.md`, title: `Note ${i}`,
    })), resolved: {}, unresolved: {} }, f.plugin.ids);
    let complete!: (prepared: unknown) => void;
    let received: any;
    let mounts = 0;
    f.plugin.runtime.prepare = (graph: unknown) => {
      received = graph;
      return new Promise((resolve) => { complete = resolve; });
    };
    f.plugin.runtime.mount = (_stage: unknown, graph: unknown, prepared: unknown) => {
      assert.equal(graph, received, "Pass the full unchanged graph to Atlas");
      assert.equal((prepared as any).seed.length, count);
      mounts++;
      return { dispose() {}, update() { assert.fail("Unexpected update"); } };
    };
    const view = await f.view();
    const find = (cls: string) => view.contentEl.find((el: ElementDouble) => el.cls === cls)!;
    assert.equal(received.nodes.length, count);
    assert.equal(find("stf-loading").hidden, false);
    assert.match(find("stf-status").text, /计算/);
    view.refresh(false);
    assert.match(find("stf-status").text, /计算/, "Identical refresh must not erase progress");
    complete({ view: {}, seed: Array.from({ length: count }, () => ({})) });
    await new Promise((resolve) => setTimeout(resolve, 35));
    assert.equal(mounts, 1);
    assert.match(find("stf-status").text, /初始化/);
    assert.equal(find("stf-loading").hidden, false, "render() return is not readiness");
    find("stf-atlas-host").displayReady = true;
    await new Promise((resolve) => setTimeout(resolve, 550));
    assert.equal(find("stf-loading").hidden, true);
    assert.equal(find("stf-atlas-frame").attributes["aria-busy"], "false");
    assert.match(find("stf-status").text, /4355 个节点/);
  } finally { f.plugin.onunload(); }
});

test("cancelled preparation cannot clear a replacement's message or mount after close", async () => {
  const f = await fixture();
  try {
    const jobs: Array<{ resolve: (value: unknown) => void; reject: (error: Error) => void }> = [];
    let mounts = 0;
    f.plugin.runtime.prepare = () => new Promise((resolve, reject) => jobs.push({ resolve, reject }));
    f.plugin.runtime.mount = () => { mounts++; return { dispose() {} }; };
    const view = await f.view();
    control(view, "标签").change(true); // no graph change, no unnecessary restart
    view.rendered = ""; view.refresh();
    const panel = view.contentEl.find((el: ElementDouble) => el.cls === "stf-loading")!;
    jobs[0]!.reject(Error("stale failure"));
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(panel.hidden, false);
    await view.onClose();
    jobs.at(-1)!.resolve({ view: {}, seed: [] });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(panel.hidden, true);
    assert.equal(mounts, 0);
  } finally { f.plugin.onunload(); }
});

test("preparation failure keeps readable retry guidance and releases the loading timer", async () => {
  const f = await fixture();
  try {
    f.plugin.runtime.prepare = () => Promise.reject(Error("布局计算超时"));
    const view = await f.view();
    await new Promise<void>((resolve) => setImmediate(resolve));
    const find = (cls: string) => view.contentEl.find((el: ElementDouble) => el.cls === cls)!;
    assert.equal(find("stf-loading").hidden, false);
    assert.match(find("stf-loading-title").text, /未完成/);
    assert.match(find("stf-loading-hint").text, /重新读取/);
    assert.equal(find("stf-atlas-frame").attributes["aria-busy"], "false");
  } finally { f.plugin.onunload(); }
});

test("keyboard note menu uses the focused row's document and file-menu public event", async () => {
  const f = await fixture();
  try {
    const view = await f.view();
    const button = view.contentEl.find((el: ElementDouble) => el.cls === "stf-note-link")!;
    let prevented = 0;
    button.events.get("keydown")({ key: "F10", shiftKey: true,
      preventDefault: () => prevented++, stopPropagation: () => prevented++ });
    const menu = MenuDouble.opened.at(-1)!;
    assert.equal(prevented, 2);
    assert.deepEqual(menu.position, { x: 20, y: 80 });
    assert.equal(menu.document, button.ownerDocument);
    assert.equal(menu.items[0]!.title, "打开笔记");
    assert.equal(f.menuEvents[0]![0], "file-menu");
    assert.equal((f.menuEvents[0]![2] as FileDouble).path, "A.md");
    assert.equal(f.menuEvents[0]![3], "seetheforest-atlas");
    assert.equal(f.menuEvents[0]![4], view.leaf);
    menu.items[1]!.click!();
    assert.equal(view.getState().centerPath, "A.md");
    assert.equal(view.getState().local, true);
  } finally { f.plugin.onunload(); }
});

test("tag and unresolved menus are labelled honestly and do not emit a file menu", async () => {
  const f = await fixture();
  try {
    const view = await f.view();
    for (const [target, title] of [
      [{ kind: "tag", tag: "#测试" }, "筛选此标签"],
      [{ kind: "unresolved", source: "A.md", link: "Missing" }, "打开未解析链接…"],
    ] as const) {
      f.plugin.index.targets.set("menu-test", target);
      view.contextMenu({ id: "menu-test" }, {});
      assert.equal(MenuDouble.opened.at(-1)!.items[0]!.title, title);
      assert.equal(MenuDouble.opened.at(-1)!.items.length, 1);
    }
    assert.equal(f.menuEvents.length, 0);
  } finally { f.plugin.onunload(); }
});

test("failed navigation reports a safe notice instead of an unhandled rejection", async () => {
  const f = await fixture();
  try {
    f.plugin.runAction(async () => { throw Error("private-note-path"); });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(f.notices.length, 1);
    assert.match(f.notices[0]!, /无法打开目标/);
    assert.doesNotMatch(f.notices[0]!, /private-note-path/);
  } finally { f.plugin.onunload(); }
});

test("unload during startup does not resurrect the plugin or register late views", async () => {
  for (const phase of ["data", "runtime"]) {
    let instance: any;
    const stop = async () => { instance.onunload(); return undefined; };
    const f = await fixture({ beforeLoad: (plugin) => { instance = plugin; },
      ...(phase === "data" ? { loadData: stop } : { runtimeLoad: stop }) });
    assert.equal(f.plugin.ready, false);
    if (phase === "data") assert.equal(f.plugin.factory, undefined);
    let calls = 0;
    f.plugin.runAction(async () => { calls++; });
    await f.plugin.persist();
    assert.equal(calls, 0);
    assert.equal(f.plugin.saved.length, 0);
  }
});

test("unload preserves requested settings writes but rejects new save requests", async () => {
  const f = await fixture();
  let finish!: () => void;
  let saves = 0;
  f.plugin.saveData = () => {
    saves++;
    return saves === 1 ? new Promise<void>((resolve) => { finish = resolve; }) : Promise.resolve();
  };
  const first = f.plugin.persist();
  await new Promise<void>((resolve) => setImmediate(resolve));
  const second = f.plugin.persist();
  f.plugin.onunload();
  await f.plugin.persist();
  finish();
  await Promise.all([first, second]);
  assert.equal(saves, 2);
});

test("unload releases the view but does not detach the user's workspace leaves", async () => {
  const f = await fixture();
  const view = await f.view();
  let releases = 0;
  let detaches = 0;
  const release = view.release.bind(view);
  view.release = () => { releases++; release(); };
  f.plugin.app.workspace.detachLeavesOfType = () => { detaches++; };
  f.plugin.onunload();
  assert.equal(releases, 1);
  assert.equal(detaches, 0);
  assert.equal(f.plugin.ready, false);
});

test("explicit reading opens the exact note in a reusable reader without replacing the graph", async () => {
  const f = await fixture();
  try {
    const view = await f.view();
    const file = new FileDouble("科学/光.md");
    const opened: unknown[] = [];
    const reader = {
      openFile: async (target: unknown) => {
        opened.push(target);
      },
    };
    let created = 0;
    let revealed = 0;
    f.plugin.index.targets.set("read-test", { kind: "file", path: file.path });
    f.plugin.app.vault.getAbstractFileByPath = (target: string) => {
      assert.equal(target, "科学/光.md");
      return file;
    };
    f.plugin.app.workspace.getLeaf = (mode: string) => {
      assert.equal(mode, "tab");
      created++;
      return reader;
    };
    f.plugin.app.workspace.iterateAllLeaves = (
      visit: (leaf: unknown) => void,
    ) => {
      visit(view.leaf);
      if (created) visit(reader);
    };
    f.plugin.app.workspace.revealLeaf = async (target: unknown) => {
      assert.equal(target, reader);
      revealed++;
    };
    await view.openNode("read-test", {});
    await view.openNode("read-test", {});
    assert.deepEqual(opened, [file, file]);
    assert.equal(created, 1);
    assert.equal(revealed, 2);
    assert.equal(f.plugin.views()[0], view);
    await view.openNode("read-test", { ctrlKey: true });
    assert.equal(created, 2);
    assert.equal(opened.length, 3);
    assert.equal(f.plugin.views()[0], view);
  } finally {
    f.plugin.onunload();
  }
});

test("mouse ribbon opens the global Atlas tab without the command palette", async () => {
  const f = await fixture();
  try {
    const states: unknown[] = [];
    let revealed = 0;
    const leaf = {
      setViewState: async (state: unknown) => {
        states.push(state);
      },
    };
    f.plugin.app.workspace.getActiveFile = () => null;
    f.plugin.app.workspace.getLeaf = (mode: string) => {
      assert.equal(mode, "tab");
      return leaf;
    };
    f.plugin.app.workspace.revealLeaf = async (target: unknown) => {
      assert.equal(target, leaf);
      revealed++;
    };
    assert.equal(f.plugin.ribbons.length, 1);
    const ribbon = f.plugin.ribbons[0];
    assert.equal(ribbon.icon, "network");
    assert.equal(ribbon.title, "打开 Atlas 全局星图");
    ribbon.callback();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(states, [
      {
        type: "seetheforest-atlas",
        active: true,
        state: { local: false, centerPath: undefined },
      },
    ]);
    assert.equal(revealed, 1);
    // The optional command uses the same route; no keyboard action is required.
    f.plugin.commands
      .find((command: { id: string }) => command.id === "open-global")
      .callback();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(states[1], states[0]);
    assert.equal(revealed, 2);
  } finally {
    f.plugin.onunload();
  }
});

test("real view events isolate filters, depth and follow across panels", async () => {
  const f = await fixture();
  try {
    const a = await f.view({ local: true, centerPath: "A.md" });
    const b = await f.view({ local: true, centerPath: "B.md" });
    control(a, "标签").change(true);
    control(a, "局部关系深度").change(4);
    control(a, "局部图跟随当前笔记").change(false);
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
    assert.equal(control(a, "局部关系深度").value, 3);
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

test("sidebar groups controls and exposes local options only in a local graph", async () => {
  const f = await fixture();
  try {
    const view = await f.view();
    const find = (cls: string) =>
      view.contentEl.find((el: ElementDouble) => el.cls === cls)!;
    assert.equal(find("stf-local-controls").hidden, true);
    assert.equal(find("stf-scope").text, "全局星图");
    assert.equal(find("stf-filters").parentElement, find("stf-sidebar"));
    assert.equal(find("stf-text").parentElement, find("stf-sidebar"));
    assert.equal(find("stf-atlas-host").parentElement, find("stf-atlas-frame"));
    assert.equal(find("stf-atlas-frame").parentElement, find("stf-workspace"));
    await view.setState(
      { local: true, centerPath: "A.md", options: { depth: 3 } },
      {},
    );
    assert.equal(find("stf-local-controls").hidden, false);
    assert.equal(find("stf-scope").text, "局部星图");
    assert.equal(control(view, "局部关系深度").value, 3);
    await view.setState({ local: false, options: { depth: 3 } }, {});
    assert.equal(find("stf-local-controls").hidden, true);
    assert.equal(view.getState().options.depth, 3);
  } finally {
    f.plugin.onunload();
  }
});

test("note rows distinguish duplicate titles by path, preserve navigation and show empty state", async () => {
  const f = await fixture();
  try {
    f.plugin.index = buildGraph(
      {
        ...snapshot,
        files: [
          { ...snapshot.files[0]!, path: "科学/光.md", title: "光" },
          { ...snapshot.files[0]!, path: "生活/光.md", title: "光" },
        ],
      },
      f.plugin.ids,
    );
    const view = await f.view();
    const list = view.contentEl.find(
      (el: ElementDouble) => el.cls === "stf-note-list",
    )!;
    assert.equal(list.tag, "ul");
    assert.equal(list.children.length, 2);
    const buttons = list.children.map((row: ElementDouble) => row.children[0]!);
    assert.deepEqual(
      buttons.map((button: ElementDouble) => button.children[1]!.text),
      ["科学/光.md", "生活/光.md"],
    );
    assert.notEqual(
      buttons[0].attributes["aria-label"],
      buttons[1].attributes["aria-label"],
    );
    let opened = "";
    view.openNode = (id: string) => {
      opened = id;
    };
    buttons[1].events.get("click")!();
    assert.equal(f.plugin.index.targets.get(opened).path, "生活/光.md");
    await view.setState({ options: { query: "path:不存在" } }, {});
    view.renderText();
    assert.equal(list.children[0]!.cls, "stf-list-empty");
  } finally {
    f.plugin.onunload();
  }
});
