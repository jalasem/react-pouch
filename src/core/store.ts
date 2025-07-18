import { useState, useEffect } from "react";
import type { Pouch as PouchType, Plugin } from "./types";

class PouchImpl<T> implements PouchType<T> {
  private value: T;
  private listeners = new Set<() => void>();
  private plugins: Plugin<T>[];

  constructor(initialValue: T, plugins: Plugin<T>[] = []) {
    this.plugins = plugins;
    this.value = this.initializeWithPlugins(initialValue);

    this.plugins.forEach((plugin) => {
      if (plugin.setup) {
        plugin.setup(this);
      }
    });
  }

  private initializeWithPlugins(initialValue: T): T {
    let value = initialValue;

    this.plugins.forEach((plugin) => {
      if (plugin.initialize) {
        value = plugin.initialize(value);
      }
    });

    return value;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T | ((current: T) => T)): void {
    const oldValue = this.value;

    if (typeof newValue === "function") {
      this.value = (newValue as (current: T) => T)(this.value);
    } else {
      this.value = newValue;
    }

    // Let plugins potentially modify the value
    this.plugins.forEach((plugin) => {
      if (plugin.onSet) {
        const result = plugin.onSet(this.value, oldValue);
        if (result !== undefined) {
          this.value = result as T;
        }
      }
    });

    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  use(): T {
    const [, forceUpdate] = useState({});

    useEffect(() => {
      const unsubscribe = this.subscribe(() => forceUpdate({}));
      return unsubscribe;
    }, []);

    return this.value;
  }
}

export function pouch<T>(
  initialValue: T,
  plugins: Plugin<T>[] = []
): PouchType<T> {
  return new PouchImpl(initialValue, plugins);
}

// Keep store as an alias for backward compatibility
export function store<T>(
  initialValue: T,
  plugins: Plugin<T>[] = []
): PouchType<T> {
  return pouch(initialValue, plugins);
}

export function usePouch<T>(pouchInstance: PouchType<T>): T {
  return pouchInstance.use();
}

// Keep useStore as an alias for backward compatibility
export function useStore<T>(storeInstance: PouchType<T>): T {
  return storeInstance.use();
}
