/** Debounced, latest-only work. An old asynchronous snapshot cannot publish. */
export class LatestJob<T> {
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  constructor(
    private compute: (cancelled: () => boolean) => Promise<T>,
    private publish: (result: T) => void,
    private error: (e: unknown) => void,
    private delay = 200,
  ) {}
  request(): void {
    if (this.disposed) return;
    clearTimeout(this.timer);
    const generation = ++this.generation;
    this.timer = setTimeout(() => {
      void this.run(generation);
    }, this.delay);
  }
  private async run(generation: number): Promise<void> {
    const cancelled = () => this.disposed || generation !== this.generation;
    try {
      const result = await this.compute(cancelled);
      if (!cancelled()) this.publish(result);
    } catch (error) {
      if (!cancelled()) this.error(error);
    }
  }
  dispose(): void {
    this.disposed = true;
    this.generation++;
    clearTimeout(this.timer);
  }
}
