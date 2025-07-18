import type { Plugin } from "../core/types";

interface LoggerOptions {
  collapsed?: boolean;
  timestamp?: boolean;
}

export function logger<T>(
  name: string,
  options: LoggerOptions = {}
): Plugin<T> {
  const { collapsed = false, timestamp = true } = options;

  return {
    setup(pouch) {
      console.log(`[${name}] Pouch initialized with:`, pouch.get());
    },

    onSet(newValue: T, oldValue: T): void {
      const time = timestamp ? new Date().toISOString() : "";
      const groupMethod = collapsed ? "groupCollapsed" : "group";

      console[groupMethod](`[${name}] State Change ${time}`);
      console.log("Previous:", oldValue);
      console.log("Current:", newValue);
      console.log("Type:", typeof newValue);
      console.groupEnd();
    },
  };
}
