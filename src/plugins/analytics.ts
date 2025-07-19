import type { SimplePlugin } from "../core/types";

interface AnalyticsOptions {
  trackInitial?: boolean;
  includeTimestamp?: boolean;
  sanitize?: (value: any) => any;
}

export function analytics<T>(
  eventName: string,
  options: AnalyticsOptions = {}
): SimplePlugin<T> {
  const {
    trackInitial = false,
    includeTimestamp = true,
    sanitize = (v) => v,
  } = options;

  return {
    setup(store) {
      if (
        trackInitial &&
        typeof window !== "undefined" &&
        (window as any).gtag
      ) {
        (window as any).gtag("event", `${eventName}_initialized`, {
          value: JSON.stringify(sanitize(store.get())),
          timestamp: includeTimestamp ? new Date().toISOString() : undefined,
        });
      }
    },

    onSet(newValue: T, oldValue: T): void {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, {
          previous_value: JSON.stringify(sanitize(oldValue)),
          new_value: JSON.stringify(sanitize(newValue)),
          timestamp: includeTimestamp ? new Date().toISOString() : undefined,
        });
      }
    },
  };
}
