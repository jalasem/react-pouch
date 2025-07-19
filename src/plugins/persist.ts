import type { SimplePlugin } from "../core/types";

interface PersistOptions {
  storage?: "localStorage" | "sessionStorage";
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === "object") {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }
    return val;
  });
}

export function persist<T>(
  key: string,
  options: PersistOptions = {}
): SimplePlugin<T> {
  const {
    storage = "localStorage",
    serialize = safeStringify,
    deserialize = JSON.parse,
  } = options;

  return {
    initialize(initialValue: T): T {
      if (typeof window === "undefined") return initialValue;

      try {
        const storageApi = window[storage];
        const storedValue = storageApi.getItem(key);

        if (storedValue !== null) {
          return deserialize(storedValue);
        }
      } catch (error) {
        console.warn(`Failed to load ${key} from ${storage}:`, error);
      }

      return initialValue;
    },

    onSet(newValue: T): void {
      if (typeof window === "undefined") return;

      try {
        const storageApi = window[storage];
        storageApi.setItem(key, serialize(newValue));
      } catch (error) {
        console.warn(`Failed to save ${key} to ${storage}:`, error);
      }
    },
  };
}
