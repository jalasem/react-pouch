import type { Plugin, Pouch } from "../core/types";

export function debounce<T>(ms: number): Plugin<T> {
  let timeout: ReturnType<typeof setTimeout>;

  return {
    setup(pouch: Pouch<T>) {
      const originalSet = pouch.set.bind(pouch);

      pouch.set = (newValue: T | ((current: T) => T)) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          originalSet(newValue);
        }, ms);
      };
    },
  };
}
