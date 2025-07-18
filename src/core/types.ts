export interface PluginHooks<T> {
  initialize?: (value: T) => T;
  setup?: (pouch: Pouch<T>) => void;
  onSet?: (newValue: T, oldValue: T) => T | void;
}

export type Plugin<T = any> = PluginHooks<T>;

export interface Pouch<T> {
  get(): T;
  set(value: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
  use(): T;
  [key: string]: any; // Allow plugins to add properties
}

// Keep Store as an alias for backward compatibility
export type Store<T> = Pouch<T>;
