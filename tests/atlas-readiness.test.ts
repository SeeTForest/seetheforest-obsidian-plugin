import { test } from "node:test";
import assert from "node:assert/strict";
import { watchAtlasReady, afterLoadingPaint } from "../src/atlas-readiness.ts";
import { loadingMessage, LoadingStatus } from "../src/loading-status.ts";

function clock() {
  let id = 0;
  const timers = new Map<number, () => void>();
  const frames = new Map<number, FrameRequestCallback>();
  return {
    timers, frames,
    setTimeout(fn: () => void) { timers.set(++id, fn); return id; },
    clearTimeout(key?: number) { if (key !== undefined) timers.delete(key); },
    requestAnimationFrame(fn: FrameRequestCallback) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key: number) { frames.delete(key); },
    tick() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach((fn) => fn()); },
    paint() { const jobs = [...frames.values()]; frames.clear(); jobs.forEach((fn) => fn(0)); },
  };
}
function host() {
  const window = clock();
  let initialized = false;
  let canvas = false;
  let calls = 0;
  const element = {
    ownerDocument: { defaultView: window },
    querySelector(selector: string) {
      assert.equal(selector, '[data-physics-ready="true"] canvas');
      calls++;
      return initialized && canvas ? {} : null;
    },
  } as unknown as HTMLElement;
  return { window, element, state: (ready: boolean, hasCanvas = true) => { initialized = ready; canvas = hasCanvas; }, calls: () => calls };
}

test("readiness requires renderer/physics signal plus canvas, not mount or elapsed time", () => {
  const h = host();
  let completed = 0;
  const stop = watchAtlasReady(h.element, new AbortController().signal, () => completed++);
  for (let i = 0; i < 500; i++) h.window.tick();
  assert.equal(completed, 0, "A slow or missing signal is never reported as success");
  h.state(true, false); h.window.tick();
  assert.equal(completed, 0);
  h.state(true); h.window.tick();
  assert.equal(completed, 0);
  h.window.paint(); assert.equal(completed, 0);
  h.window.paint(); assert.equal(completed, 1);
  assert.equal(h.window.timers.size + h.window.frames.size, 0);
  stop(); stop();
});

test("readiness rechecks signal after paint and isolates cancellation by instance", () => {
  const a = host(), b = host();
  const abort = new AbortController();
  let count = 0;
  watchAtlasReady(a.element, abort.signal, () => count++);
  watchAtlasReady(b.element, new AbortController().signal, () => count++);
  a.state(true); a.window.tick(); a.window.paint(); abort.abort(); a.window.paint();
  assert.equal(count, 0);
  assert.equal(a.window.timers.size + a.window.frames.size, 0);
  b.state(true); b.window.tick(); b.window.paint(); b.state(false); b.window.paint();
  assert.equal(count, 0);
  b.state(true); b.window.tick(); b.window.paint(); b.window.paint();
  assert.equal(count, 1);
});

test("already cancelled readiness never schedules or reads the DOM", () => {
  const h = host(), abort = new AbortController(); abort.abort();
  watchAtlasReady(h.element, abort.signal, () => assert.fail("Stale callback"));
  assert.equal(h.calls(), 0);
  assert.equal(h.window.timers.size, 0);
});

test("loading paint yields two frames and cancels without mounting late", async () => {
  for (const when of ["before", "first-frame", "second-frame", "complete"]) {
    const h = host(), abort = new AbortController();
    if (when === "before") abort.abort();
    const pending = afterLoadingPaint(h.element, abort.signal);
    if (when === "first-frame") abort.abort();
    h.window.paint();
    if (when === "second-frame") abort.abort();
    h.window.paint();
    if (when === "complete") await pending;
    else await assert.rejects(pending, { name: "AbortError" });
    assert.equal(h.window.frames.size, 0);
  }
});

test("long-wait wording is truthful, contains no invented percentage or failure", () => {
  assert.match(loadingMessage("layout", 0).title, /计算/);
  assert.match(loadingMessage("display", 0).title, /初始化/);
  assert.match(loadingMessage("layout", 16).hint, /不是失败/);
  assert.match(loadingMessage("display", 120).hint, /尚未收到就绪信号/);
  assert.equal(loadingMessage("display", 120.9).elapsed, "已等待 120 秒");
  assert.doesNotMatch(JSON.stringify(loadingMessage("display", 1000)), /%|预计|完成率/);
});

test("loading UI preserves counts, stops clocks on failure/close, and does not live-announce seconds", () => {
  const window = clock();
  class Element {
    ownerDocument = { defaultView: window };
    hidden = false;
    text = "";
    children: Element[] = [];
    attributes: Record<string, string> = {};
    cls = "";
    createEl(_tag: string, options: { cls?: string; attr?: Record<string, string> } = {}) {
      const child = new Element(); child.cls = options.cls ?? ""; child.attributes = options.attr ?? {};
      this.children.push(child); return child;
    }
    createDiv(options: { cls?: string }) { return this.createEl("div", options); }
    setText(text: string) { this.text = text; }
    setAttribute(key: string, value: string) { this.attributes[key] = value; }
  }
  const frame = new Element(), status = new Element();
  const loading = new LoadingStatus(frame as unknown as HTMLElement, status as unknown as HTMLElement);
  const panel = frame.children[0]!, card = panel.children[0]!;
  loading.begin(4355, 5418, false);
  assert.equal(card.children[1]!.text, "4355 个节点 · 5418 条关系");
  assert.equal(card.children[2]!.attributes["aria-hidden"], "true");
  assert.equal(frame.attributes["aria-busy"], "true");
  assert.equal(panel.hidden, false);
  loading.setPhase("display");
  assert.match(status.text, /初始化/);
  window.tick(); assert.equal(window.timers.size, 1);
  loading.fail("布局计算超时。");
  assert.equal(window.timers.size, 0); assert.equal(panel.hidden, false);
  assert.match(card.children[3]!.text, /重新读取/);
  loading.begin(5000, 7000, true);
  assert.equal(panel.attributes["data-updating"], "true");
  assert.equal(card.children[1]!.text, "5000 个节点 · 7000 条关系");
  loading.stop(); loading.stop();
  assert.equal(window.timers.size, 0); assert.equal(panel.hidden, true);
  assert.equal(frame.attributes["aria-busy"], "false");
});
