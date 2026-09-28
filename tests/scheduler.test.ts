import { test } from "node:test";
import assert from "node:assert/strict";
import { LatestJob } from "../src/scheduler.ts";
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));
test("a slower stale computation never replaces a newer snapshot", async () => {
  const pending: Array<(value: number) => void> = [],
    published: number[] = [];
  const job = new LatestJob(
    () => new Promise<number>((resolve) => pending.push(resolve)),
    (v) => published.push(v),
    () => assert.fail(),
    0,
  );
  job.request();
  await tick();
  job.request();
  await tick();
  pending[1]!(2);
  await tick();
  pending[0]!(1);
  await tick();
  assert.deepEqual(published, [2]);
  job.dispose();
});
test("disable cancels pending timers and ignores in-flight completion", async () => {
  let resolve: ((n: number) => void) | undefined;
  const published: number[] = [];
  const job = new LatestJob(
    () =>
      new Promise<number>((r) => {
        resolve = r;
      }),
    (v) => published.push(v),
    () => assert.fail(),
    0,
  );
  job.request();
  await tick();
  job.dispose();
  resolve!(1);
  await tick();
  job.request();
  await tick();
  assert.deepEqual(published, []);
});
test("debounces event bursts and reports recoverable failures once", async () => {
  let starts = 0,
    errors = 0;
  const job = new LatestJob(
    async () => {
      starts++;
      throw Error("fixture");
    },
    () => assert.fail(),
    () => {
      errors++;
    },
    0,
  );
  for (let i = 0; i < 100; i++) job.request();
  await tick();
  assert.equal(starts, 1);
  assert.equal(errors, 1);
  job.dispose();
});
