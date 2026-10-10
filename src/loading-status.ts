type Phase = "layout" | "display";

export function loadingMessage(phase: Phase, seconds: number) {
  return {
    title: phase === "layout" ? "正在计算完整星图布局" : "正在初始化星图显示",
    elapsed: `已等待 ${Math.max(0, Math.floor(seconds))} 秒`,
    hint: seconds >= 60
      ? "等待时间较长，尚未收到就绪信号。可以继续等待；如持续无响应，可点击顶部“重新读取”。"
      : seconds >= 15
        ? "大图初始化可能需要较长时间。这不是失败提示，请耐心等待，避免反复重新读取。"
        : "正在本机处理当前范围的全部节点与关系；不会上传笔记或自动删减节点。",
  };
}

/** Host-owned UI, outside the element managed by Solid/Atlas. */
export class LoadingStatus {
  private panel: HTMLElement;
  private title: HTMLElement;
  private counts: HTMLElement;
  private elapsed: HTMLElement;
  private hint: HTMLElement;
  private window: Window;
  private timer?: number;
  private started = 0;
  private phase: Phase = "layout";
  private lastHint = "";
  constructor(private frame: HTMLElement, private status: HTMLElement) {
    this.window = frame.ownerDocument.defaultView ?? window;
    this.panel = frame.createDiv({ cls: "stf-loading" });
    this.panel.hidden = true;
    const card = this.panel.createDiv({ cls: "stf-loading-card" });
    this.title = card.createEl("strong", { cls: "stf-loading-title" });
    this.counts = card.createEl("p", { cls: "stf-loading-counts" });
    // Do not announce a changing timer every second to screen readers.
    this.elapsed = card.createEl("p", { cls: "stf-loading-elapsed", attr: { "aria-hidden": "true" } });
    this.hint = card.createEl("p", { cls: "stf-loading-hint" });
  }
  begin(nodes: number, edges: number, updating: boolean): void {
    this.stop();
    this.started = Date.now();
    this.panel.hidden = false;
    this.panel.setAttribute("data-updating", String(updating));
    this.frame.setAttribute("aria-busy", "true");
    this.counts.setText(`${nodes} 个节点 · ${edges} 条关系`);
    this.setPhase("layout");
    this.tick();
  }
  setPhase(phase: Phase): void {
    this.phase = phase;
    const { title } = loadingMessage(phase, 0);
    this.title.setText(title);
    this.status.setText(`${title}…`);
  }
  private tick(): void {
    const message = loadingMessage(this.phase, (Date.now() - this.started) / 1000);
    this.elapsed.setText(message.elapsed);
    if (this.lastHint !== message.hint) {
      this.lastHint = message.hint;
      this.hint.setText(message.hint);
    }
    this.timer = this.window.setTimeout(() => this.tick(), 1000);
  }
  fail(message: string): void {
    this.stop();
    this.panel.hidden = false;
    this.title.setText("星图加载未完成");
    this.hint.setText(`${message} 可点击顶部“重新读取”重试。`);
    this.status.setText(message);
  }
  stop(): void {
    this.window.clearTimeout(this.timer);
    this.timer = undefined;
    this.panel.hidden = true;
    this.frame.setAttribute("aria-busy", "false");
    this.lastHint = "";
  }
}
