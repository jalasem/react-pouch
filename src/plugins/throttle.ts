import type { Plugin, Pouch } from "../core/types";

export function throttle<T>(ms: number): Plugin<T> {
  let lastCall = 0;
  let pendingValue: T | undefined;
  let timeout: ReturnType<typeof setTimeout>;

  return {
    setup(pouch: Pouch<T>) {
      const originalSet = pouch.set.bind(pouch);

      pouch.set = (newValue: T | ((current: T) => T)) => {
        const now = Date.now();

        if (now - lastCall >= ms) {
          lastCall = now;
          originalSet(newValue);
          clearTimeout(timeout);
        } else {
          pendingValue =
            typeof newValue === "function"
              ? (newValue as any)(pouch.get())
              : newValue;

          clearTimeout(timeout);
          timeout = setTimeout(() => {
            if (pendingValue !== undefined) {
              lastCall = Date.now();
              originalSet(pendingValue);
              pendingValue = undefined;
            }
          }, ms - (now - lastCall));
        }
      };
    },
  };
}
