import { useState, useEffect } from "react";
import type { Pouch as PouchType, Plugin, PouchWithPlugins } from "./types";

class PouchImpl<T> implements PouchType<T> {
  private value: T;
  private listeners = new Set<() => void>();
  private plugins: Plugin<T, any>[];

  constructor(initialValue: T, plugins: Plugin<T, any>[] = []) {
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

// Overloaded function signatures for type-safe plugin inference
export function pouch<T>(initialValue: T): PouchType<T>;
export function pouch<T, TPlugins extends readonly Plugin<T, any>[]>(
  initialValue: T,
  plugins: TPlugins
): PouchWithPlugins<T, TPlugins>;
export function pouch<T>(
  initialValue: T,
  plugins?: Plugin<T, any>[]
): any {
  return new PouchImpl(initialValue, plugins || []);
}

// Keep store as an alias for backward compatibility with additional overload for explicit types
export function store<T>(initialValue: T): PouchType<T>;
export function store<T>(initialValue: T, plugins: Plugin<T, any>[]): PouchType<T>;
export function store<T, TPlugins extends readonly Plugin<T, any>[]>(
  initialValue: T,
  plugins: TPlugins
): PouchWithPlugins<T, TPlugins>;
export function store<T>(
  initialValue: T,
  plugins?: Plugin<T, any>[]
): any {
  return pouch(initialValue, plugins || []);
}

export function usePouch<T>(pouchInstance: PouchType<T>): T {
  return pouchInstance.use();
}

// Keep useStore as an alias for backward compatibility
export function useStore<T>(storeInstance: PouchType<T>): T {
  return storeInstance.use();
}
