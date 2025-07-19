export interface PluginHooks<T> {
  initialize?: (value: T) => T;
  setup?: (pouch: Pouch<T>) => void;
  onSet?: (newValue: T, oldValue: T) => T | void;
}

// Base plugin interface with optional type augmentation
export interface Plugin<T = any, TAugmentation = {}> extends PluginHooks<T> {
  readonly __type?: TAugmentation; // Phantom type for TypeScript inference
}

// Type alias for plugins that don't provide any augmentation
export type SimplePlugin<T> = Plugin<T>;

// Core Pouch interface
export interface Pouch<T> {
  get(): T;
  set(value: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
  use(): T;
  [key: string]: any; // Allow plugins to add properties
}

// Type-safe Pouch with plugin augmentations
export type PouchWithPlugins<T, TPlugins extends readonly Plugin<T, any>[]> = 
  Pouch<T> & UnionToIntersection<InferPluginAugmentations<TPlugins>>;

// Extract augmentation types from plugin array
type InferPluginAugmentations<TPlugins extends readonly Plugin<any, any>[]> = 
  TPlugins extends readonly [infer First, ...infer Rest]
    ? First extends Plugin<any, infer TAug>
      ? Rest extends readonly Plugin<any, any>[]
        ? TAug & InferPluginAugmentations<Rest>
        : TAug
      : {}
    : {};

// Convert union to intersection for proper method merging
type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// Keep Store as an alias for backward compatibility
export type Store<T> = Pouch<T>;
