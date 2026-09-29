import {
  Plugin,
  ItemView,
  PluginSettingTab,
  Setting,
  TFile,
  Keymap,
  Notice,
  Modal,
  Menu,
  type App,
  type WorkspaceLeaf,
  type ViewStateResult,
} from "obsidian";
import { AtlasRuntime } from "./atlas-adapter";
import {
  buildGraph,
  Identities,
  projectGraph,
  type ContentGraph,
  type GraphNode,
  type IndexedGraph,
  type Target,
} from "./graph";
import { normalizeSettings, DEFAULTS, type Settings } from "./settings";
import { compileSearch } from "./search";
import { readSnapshot } from "./vault-adapter";
import { LatestJob } from "./scheduler";
import {
  normalizeViewOptions,
  restoreViewState,
  type ViewOptions,
} from "./view-state";

const VIEW = "seetheforest-atlas";
export default class ForestPlugin extends Plugin {
  settings = normalizeSettings(undefined);
  ids = new Identities();
  runtime = new AtlasRuntime();
  index?: IndexedGraph;
  error = "正在等待笔记索引…";
  ready = false;
  job?: LatestJob<IndexedGraph>;
  private saving = Promise.resolve();
  private alive = true;
  private fingerprint = "";
  async onload(): Promise<void> {
    const data = await this.loadData();
    this.settings = normalizeSettings(data?.settings);
    this.ids = new Identities(data?.identities);
    this.registerView(VIEW, (leaf) => new ForestView(leaf, this));
    this.addRibbonIcon("network", "打开见林星图", () => {
      void this.open(false);
    });
    this.addCommand({
      id: "open-global",
      name: "打开全局星图",
      callback: () => {
        void this.open(false);
      },
    });
    this.addCommand({
      id: "open-local",
      name: "打开局部星图",
      callback: () => {
        void this.open(true);
      },
    });
    this.addCommand({
      id: "rebuild",
      name: "重新读取当前笔记库",
      callback: () => this.refresh(),
    });
    this.addSettingTab(new ForestSettings(this.app, this));
    this.job = new LatestJob(
      async (cancelled) => {
        const snapshot = await readSnapshot(
          this.app,
          this.views().some((view) => view.needsText()) ||
            this.settings.exclusions.length > 0 ||
            this.settings.groups.length > 0,
          cancelled,
        );
        if (cancelled()) throw new Error("snapshot-cancelled");
        return buildGraph(snapshot, this.ids);
      },
      (index) => {
        this.index = index;
        this.error = "";
        const fingerprint = JSON.stringify(index.graph);
        if (fingerprint !== this.fingerprint) {
          this.fingerprint = fingerprint;
          this.views().forEach((view) => view.refresh());
        } else this.views().forEach((view) => view.refresh(false));
        void this.persist();
      },
      (error) => {
        this.error =
          error instanceof Error ? error.message : "索引失败，请重试";
        this.views().forEach((view) => view.showError());
      },
    );
    this.register(() => this.job?.dispose());
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => this.refresh()),
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.refresh()),
    );
    this.registerEvent(this.app.vault.on("create", () => this.refresh()));
    this.registerEvent(this.app.vault.on("modify", () => this.refresh()));
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.ids.remove(file.path);
        this.refresh();
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        this.ids.rename(oldPath, file.path);
        this.views().forEach((view) => view.rename(oldPath, file.path));
        this.refresh();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file) this.views().forEach((view) => view.follow(file.path));
      }),
    );
    try {
      await this.runtime.load(this.app, this.manifest);
      this.ready = true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Atlas 加载失败";
      new Notice(this.error);
    }
    this.app.workspace.onLayoutReady(() => {
      if (this.alive) this.refresh();
    });
  }
  onunload(): void {
    this.alive = false;
    this.job?.dispose();
    this.views().forEach((view) => view.release());
    this.app.workspace.detachLeavesOfType(VIEW);
    this.runtime.dispose();
  }
  views(): ForestView[] {
    return this.app.workspace
      .getLeavesOfType(VIEW)
      .map((leaf) => leaf.view)
      .filter((view): view is ForestView => view instanceof ForestView);
  }
  refresh(): void {
    if (this.alive && this.ready) this.job?.request();
  }
  persist(): Promise<void> {
    const data = {
      schemaVersion: 1,
      settings: structuredClone(this.settings),
      identities: { ...this.ids.paths },
    };
    this.saving = this.saving.catch(() => {}).then(() => this.saveData(data));
    return this.saving.catch(() => {
      new Notice("见林设置保存失败，请检查笔记库写入权限。");
    });
  }
  async open(local: boolean): Promise<void> {
    const path = this.app.workspace.getActiveFile()?.path;
    const leaf = local
      ? (this.app.workspace.getRightLeaf(false) ??
        this.app.workspace.getLeaf("split"))
      : this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: VIEW,
      active: true,
      state: { local, centerPath: path },
    });
    await this.app.workspace.revealLeaf(leaf);
  }
}

class ForestView extends ItemView {
  private local = false;
  private centerPath = "";
  private options: ViewOptions;
  private syncControls: Array<() => void> = [];
  private status?: HTMLElement;
  private stage?: HTMLElement;
  private text?: HTMLElement;
  private mounted?: ReturnType<AtlasRuntime["mount"]>;
  private rendered = "";
  private reader?: WorkspaceLeaf;
  private layoutAbort?: AbortController;
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: ForestPlugin,
  ) {
    super(leaf);
    this.options = normalizeViewOptions(undefined, plugin.settings);
  }
  getViewType(): string {
    return VIEW;
  }
  getDisplayText(): string {
    return this.local ? "见林 · 局部星图" : "见林 · 全局星图";
  }
  getIcon(): string {
    return "network";
  }
  getState(): Record<string, unknown> {
    return {
      local: this.local,
      centerPath: this.centerPath,
      options: { ...this.options },
    };
  }
  async setState(
    state: Record<string, unknown>,
    result: ViewStateResult,
  ): Promise<void> {
    const restored = restoreViewState(state, this.plugin.settings);
    this.local = restored.local;
    this.centerPath = restored.centerPath;
    this.options = restored.options;
    this.syncControls.forEach((sync) => sync());
    await super.setState(state, result);
    if (this.needsText()) this.refreshQuery();
    else this.refresh();
  }
  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.syncControls = [];
    this.contentEl.addClass("stf-view");
    const tools = this.contentEl.createDiv({ cls: "stf-toolbar" });
    const search = tools.createEl("input", {
      type: "search",
      placeholder: "搜索：词语、path:、tag:、[属性:值]",
    });
    search.value = this.options.query;
    this.syncControls.push(() => {
      search.value = this.options.query;
    });
    search.setAttribute("aria-label", "筛选笔记");
    this.registerDomEvent(search, "input", () => {
      this.updateOptions({ query: search.value });
    });
    const retry = tools.createEl("button", { text: "重新读取" });
    this.registerDomEvent(retry, "click", () => {
      this.rendered = "";
      this.plugin.refresh();
    });
    this.status = this.contentEl.createDiv({
      cls: "stf-status",
      attr: { role: "status", "aria-live": "polite" },
    });
    const controls = this.contentEl.createEl("details", { cls: "stf-filters" });
    controls.createEl("summary", { text: "范围与过滤" });
    for (const [key, title] of [
      ["tags", "标签"],
      ["attachments", "附件"],
      ["existingOnly", "仅已有笔记"],
      ["orphans", "孤立节点"],
      ["follow", "局部图跟随当前笔记"],
    ] as const) {
      new Setting(controls).setName(title).addToggle((toggle) => {
        toggle.setValue(this.options[key]).onChange((value) => {
          this.updateOptions({ [key]: value });
        });
        this.syncControls.push(() => {
          toggle.setValue(this.options[key]);
        });
      });
    }
    new Setting(controls).setName("局部关系深度").addSlider((slider) => {
      slider
        .setLimits(0, 20, 1)
        .setValue(this.options.depth)
        .setDynamicTooltip()
        .onChange((value) => {
          this.updateOptions({ depth: value });
        });
      this.syncControls.push(() => {
        slider.setValue(this.options.depth);
      });
    });
    new Setting(controls).setName("局部关系方向").addDropdown((dropdown) => {
      dropdown
        .addOptions({ both: "双向", incoming: "入链", outgoing: "出链" })
        .setValue(this.options.direction)
        .onChange((value) => {
          this.updateOptions({ direction: value as Settings["direction"] });
        });
      this.syncControls.push(() => {
        dropdown.setValue(this.options.direction);
      });
    });
    this.stage = this.contentEl.createDiv({ cls: "stf-atlas-host" });
    const details = this.contentEl.createEl("details", { cls: "stf-text" });
    details.createEl("summary", { text: "笔记列表（键盘与屏幕阅读器）" });
    this.text = details.createDiv();
    this.registerDomEvent(details, "toggle", () => {
      if (details.open) this.renderText();
    });
    this.refresh();
  }
  async onClose(): Promise<void> {
    this.release();
    this.syncControls = [];
  }
  needsText(): boolean {
    return this.options.query.trim().length > 0;
  }
  private updateOptions(patch: Partial<ViewOptions>): void {
    const previousQuery = this.options.query;
    this.options = normalizeViewOptions({ ...this.options, ...patch });
    this.syncControls.forEach((sync) => sync());
    this.app.workspace.requestSaveLayout();
    // Re-read text for any view that needs it; do not persist bodies in workspace state.
    if (previousQuery !== this.options.query) this.refreshQuery();
    else this.refresh();
  }
  private refreshQuery(): void {
    this.layoutAbort?.abort();
    this.layoutAbort = undefined;
    this.rendered = "";
    this.status?.setText("正在更新本面板的筛选…");
    this.plugin.refresh();
  }
  release(): void {
    this.layoutAbort?.abort();
    this.layoutAbort = undefined;
    this.mounted?.dispose();
    this.mounted = undefined;
    this.rendered = "";
  }
  rename(oldPath: string, newPath: string): void {
    if (
      this.centerPath === oldPath ||
      this.centerPath.startsWith(`${oldPath}/`)
    ) {
      this.centerPath = newPath + this.centerPath.slice(oldPath.length);
      this.app.workspace.requestSaveLayout();
    }
  }
  follow(path: string): void {
    if (this.local && this.options.follow && this.centerPath !== path) {
      this.centerPath = path;
      this.refresh();
      this.app.workspace.requestSaveLayout();
    }
  }
  showError(): void {
    this.status?.setText(this.plugin.error);
  }
  private projection(): ContentGraph | undefined {
    const index = this.plugin.index;
    if (!index) return;
    const matches = compileSearch(this.options.query);
    const excluded = this.plugin.settings.exclusions.map((query) =>
      compileSearch(query),
    );
    const center = this.local
      ? (this.plugin.ids.paths[this.centerPath] ?? "missing-center")
      : undefined;
    return projectGraph(
      index,
      this.options,
      (entry) => matches(entry) && !excluded.some((test) => test(entry)),
      center,
    );
  }
  refresh(_topologyChanged = true): void {
    if (!this.stage || !this.plugin.ready || !this.plugin.index) {
      this.showError();
      return;
    }
    try {
      const graph = this.projection()!;
      this.status?.setText(
        `${this.local ? `局部：${this.centerPath || "请选择笔记"} · ` : ""}${graph.nodes.length} 个节点 · ${graph.edges.length} 条关系`,
      );
      const groupTests = this.plugin.settings.groups
        .filter((g) => g.query.trim())
        .map((g) => ({ ...g, test: compileSearch(g.query) }));
      const colors: Record<string, string> = Object.create(null);
      for (const node of graph.nodes) {
        const entry = this.plugin.index.entries.get(node.id);
        const group = entry && groupTests.find((g) => g.test(entry));
        if (group) colors[node.id] = group.color;
      }
      const fingerprint = JSON.stringify([graph, colors]);
      if (fingerprint === this.rendered) return;
      this.rendered = fingerprint;
      if (!graph.nodes.length) {
        this.release();
        this.stage.setText("当前范围没有节点，请调整过滤条件或选择笔记。");
      } else {
        this.layoutAbort?.abort();
        const controller = new AbortController();
        this.layoutAbort = controller;
        this.status?.setText(
          `正在准备 ${graph.nodes.length} 个节点的完整星图…`,
        );
        void this.plugin.runtime
          .prepare(graph, controller.signal)
          .then((prepared) => {
            if (controller.signal.aborted || !this.stage) return;
            if (this.mounted) this.mounted.update(graph, prepared.seed, colors);
            else {
              this.stage.empty();
              this.mounted = this.plugin.runtime.mount(
                this.stage,
                graph,
                prepared,
                colors,
                (node, event) => {
                  void this.openNode(node.id, event);
                },
                (node, event) => this.contextMenu(node, event),
              );
            }
            this.status?.setText(
              `${graph.nodes.length} 个节点 · ${graph.edges.length} 条关系`,
            );
          })
          .catch((error) => {
            if (!controller.signal.aborted) {
              this.rendered = "";
              this.status?.setText(
                error instanceof Error ? error.message : "星图准备失败，请重试",
              );
            }
          });
      }
      if (this.text?.parentElement?.hasAttribute("open")) this.renderText();
    } catch (error) {
      this.status?.setText(
        error instanceof Error ? error.message : "无法显示星图",
      );
    }
  }
  private renderText(): void {
    if (!this.text) return;
    this.text.empty();
    try {
      const graph = this.projection();
      if (!graph) return;
      // Text fallback never truncates the knowledge network.
      for (const node of graph.nodes) {
        const button = this.text.createEl("button", {
          text: node.title,
          cls: "stf-note-link",
        });
        button.addEventListener("click", (event) => {
          void this.openNode(node.id, event);
        });
        button.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.contextMenu(node, event);
        });
      }
    } catch (error) {
      this.text.setText(error instanceof Error ? error.message : "列表不可用");
    }
  }
  private contextMenu(node: GraphNode, event: MouseEvent): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item.setTitle("打开笔记").onClick(() => {
        void this.openNode(node.id, event);
      }),
    );
    const target = this.plugin.index?.targets.get(node.id);
    if (target?.kind === "file")
      menu.addItem((item) =>
        item.setTitle("在此查看局部关系").onClick(() => {
          this.local = true;
          this.centerPath = target.path;
          this.refresh();
          this.app.workspace.requestSaveLayout();
        }),
      );
    menu.showAtMouseEvent(event);
  }
  private async openNode(
    id: string,
    event: MouseEvent | KeyboardEvent,
  ): Promise<void> {
    const target = this.plugin.index?.targets.get(id);
    if (!target) return;
    if (target.kind === "tag") {
      this.updateOptions({ query: `tag:${target.tag}` });
      return;
    }
    if (target.kind === "unresolved") {
      new MissingNoteModal(this.app, target, () => {
        void this.app.workspace.openLinkText(
          target.link,
          target.source,
          Keymap.isModEvent(event) || "tab",
        );
      }).open();
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(target.path);
    if (!(file instanceof TFile)) {
      new Notice("笔记已移动或删除，正在更新星图。");
      this.plugin.refresh();
      return;
    }
    const modifier = Keymap.isModEvent(event);
    if (modifier) {
      await this.app.workspace.getLeaf(modifier).openFile(file);
      return;
    }
    let readerExists = false;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf === this.reader) readerExists = true;
    });
    if (!this.reader || !readerExists)
      this.reader = this.app.workspace.getLeaf("tab");
    await this.reader.openFile(file);
    await this.app.workspace.revealLeaf(this.reader);
  }
}

class MissingNoteModal extends Modal {
  constructor(
    app: App,
    private target: Extract<Target, { kind: "unresolved" }>,
    private openTarget: () => void,
  ) {
    super(app);
  }
  onOpen(): void {
    this.titleEl.setText("未解析的链接");
    this.contentEl.createEl("p", {
      text: `${this.target.link} 尚未对应已有笔记。继续将由 Obsidian 按原链接位置打开或创建。`,
    });
    new Setting(this.contentEl)
      .addButton((button) =>
        button.setButtonText("打开或创建笔记").onClick(() => {
          this.close();
          this.openTarget();
        }),
      )
      .addButton((button) =>
        button.setButtonText("取消").onClick(() => this.close()),
      );
  }
  onClose(): void {
    this.contentEl.empty();
  }
}
class ForestSettings extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: ForestPlugin,
  ) {
    super(app, plugin);
  }
  display(): void {
    this.containerEl.empty();
    this.containerEl.createEl("p", {
      text: "所有笔记只在当前设备读取。Atlas 保留黑曜石星图视觉；原生 Graph 功能对照见插件 README。",
    });
    new Setting(this.containerEl)
      .setName("排除条件")
      .setDesc(
        "每行一个搜索条件。Obsidian 内部排除设置没有稳定公共 API；请在此显式设置。",
      )
      .addTextArea((area) =>
        area
          .setValue(this.plugin.settings.exclusions.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.exclusions = value
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean);
            await this.plugin.persist();
            this.plugin.refresh();
          }),
      );
    this.containerEl.createEl("h3", { text: "颜色分组（第一个匹配条件优先）" });
    this.plugin.settings.groups.forEach((group, index) => {
      new Setting(this.containerEl)
        .setName(`分组 ${index + 1}`)
        .addText((text) =>
          text
            .setPlaceholder("例如 tag:学习")
            .setValue(group.query)
            .onChange(async (value) => {
              group.query = value;
              await this.plugin.persist();
              this.plugin.refresh();
            }),
        )
        .addColorPicker((picker) =>
          picker.setValue(group.color).onChange(async (value) => {
            group.color = value;
            await this.plugin.persist();
            this.plugin.refresh();
          }),
        )
        .addButton((button) =>
          button.setButtonText("移除").onClick(async () => {
            this.plugin.settings.groups.splice(index, 1);
            await this.plugin.persist();
            this.plugin.refresh();
            this.display();
          }),
        );
    });
    new Setting(this.containerEl).addButton((button) =>
      button.setButtonText("添加颜色分组").onClick(async () => {
        this.plugin.settings.groups.push({ query: "", color: "#92b0c8" });
        await this.plugin.persist();
        this.display();
      }),
    );
    new Setting(this.containerEl)
      .setName("恢复插件默认设置")
      .setDesc(
        "重置排除条件、颜色分组与新面板默认值；不改变已打开面板的独立范围。",
      )
      .addButton((button) =>
        button.setButtonText("恢复").onClick(async () => {
          this.plugin.settings = normalizeSettings(DEFAULTS);
          await this.plugin.persist();
          this.plugin.refresh();
          this.display();
        }),
      );
  }
}
