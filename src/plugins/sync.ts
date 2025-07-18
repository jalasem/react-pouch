import type { Plugin } from "../core/types";

interface SyncOptions {
  debounce?: number;
  onError?: (error: Error) => void;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  method?: string;
  mode?: RequestMode;
  [key: string]: any;
}

export function sync<T>(url: string, options: SyncOptions = {}): Plugin<T> {
  const { debounce = 500, onError = console.error, headers = {}, ...fetchOptions } = options;
  let timeout: ReturnType<typeof setTimeout>;

  return {
    setup(pouch) {
      if (typeof window === "undefined") return;
      
      // Use global fetch if available
      const fetchFn = typeof fetch !== "undefined" ? fetch : (global as any).fetch;
      if (!fetchFn) return;

      try {
        fetchFn(url)
          .then((res: any) => res.json())
          .then((data: T) => pouch.set(data))
          .catch(onError);
      } catch (error) {
        onError(error as Error);
      }
    },

    onSet(newValue: T): void {
      if (typeof window === "undefined") return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Use global fetch if available
        const fetchFn = typeof fetch !== "undefined" ? fetch : (global as any).fetch;
        if (!fetchFn) return;
        
        try {
          const requestOptions = {
            method: "POST",
            body: JSON.stringify(newValue),
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            ...fetchOptions,
          };
          
          fetchFn(url, requestOptions).catch(onError);
        } catch (error) {
          onError(error as Error);
        }
      }, debounce);
    },
  };
}
