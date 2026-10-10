/** Read-only compatibility adapter for the pinned Atlas 0.1.7 DOM signal.
 * Never interprets coordinates, changes physics, or equates elapsed time with readiness.
 * A missing signal remains pending; the host shows a non-blocking long-wait hint.
 */
export function watchAtlasReady(
  element: HTMLElement,
  signal: AbortSignal,
  ready: () => void,
): () => void {
  const ownerWindow = element.ownerDocument.defaultView ?? window;
  let timer: number | undefined;
  let frame: number | undefined;
  let stopped = false;
  const isReady = () => Boolean(element.querySelector(
    '[data-physics-ready="true"] canvas',
  ));
  const stop = () => {
    stopped = true;
    ownerWindow.clearTimeout(timer);
    if (frame !== undefined) ownerWindow.cancelAnimationFrame(frame);
    signal.removeEventListener("abort", stop);
  };
  const check = () => {
    if (stopped) return;
    if (!isReady()) {
      timer = ownerWindow.setTimeout(check, 500);
      return;
    }
    // Let the initialized renderer paint before removing the host message.
    frame = ownerWindow.requestAnimationFrame(() => {
      frame = ownerWindow.requestAnimationFrame(() => {
        if (stopped) return;
        if (!isReady()) { check(); return; }
        stop();
        ready();
      });
    });
  };
  if (signal.aborted) { stop(); return stop; }
  signal.addEventListener("abort", stop, { once: true });
  timer = ownerWindow.setTimeout(check, 0);
  return stop;
}

/** Give the loading message a paint opportunity before synchronous component work. */
export function afterLoadingPaint(element: HTMLElement, signal: AbortSignal): Promise<void> {
  const ownerWindow = element.ownerDocument.defaultView ?? window;
  return new Promise((resolve, reject) => {
    let frame: number | undefined;
    const abort = () => {
      if (frame !== undefined) ownerWindow.cancelAnimationFrame(frame);
      signal.removeEventListener("abort", abort);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    frame = ownerWindow.requestAnimationFrame(() => {
      frame = ownerWindow.requestAnimationFrame(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      });
    });
  });
}
