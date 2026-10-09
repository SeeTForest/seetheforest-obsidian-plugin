// Numeric browser timer handles backed by Node only in the test process.
export function browserTimers() {
  let next = 0;
  const pending = new Map<number, ReturnType<typeof setTimeout>>();
  return {
    pending,
    setTimeout(callback: () => void, delay = 0) {
      const id = ++next;
      pending.set(id, setTimeout(() => { pending.delete(id); callback(); }, delay));
      return id;
    },
    clearTimeout(id?: number) {
      if (id !== undefined) { clearTimeout(pending.get(id)); pending.delete(id); }
    },
  };
}
