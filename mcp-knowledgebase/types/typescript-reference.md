# TypeScript Reference for React Pouch

## Core Types

### Pouch Interface

```typescript
interface Pouch<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(listener: (value: T) => void): () => void;
  use(): T;
  [key: string]: any; // Allows plugin extensions
}
```

### Plugin Interface

```typescript
interface Plugin<T> {
  name: string;
  initialize?: (value: T) => T;
  setup?: (pouch: Pouch<T>) => void;
  onSet?: (newValue: T, oldValue: T) => T | void;
}

// Plugin hook types
type InitializeHook<T> = (value: T) => T;
type SetupHook<T> = (pouch: Pouch<T>) => void;
type OnSetHook<T> = (newValue: T, oldValue: T) => T | void;
```

### Factory Function

```typescript
declare function pouch<T>(
  initialValue: T,
  plugins?: Plugin<T>[]
): Pouch<T>;
```

## Plugin-Specific Types

### Analytics Plugin

```typescript
interface AnalyticsConfig {
  trackingId: string;
  eventName?: string;
  customData?: (value: any) => Record<string, any>;
}

declare function analytics<T>(config: AnalyticsConfig): Plugin<T>;
```

### Computed Plugin

```typescript
interface ComputedPouch<T, R> extends Pouch<T> {
  computed: Pouch<R>;
}

declare function computed<T, R>(
  computeFn: (value: T) => R
): Plugin<T> & {
  setup: (pouch: Pouch<T>) => void;
};
```

### Debounce Plugin

```typescript
interface DebounceConfig {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

declare function debounce<T>(
  delay: number | DebounceConfig
): Plugin<T>;
```

### Encrypt Plugin

```typescript
interface EncryptConfig {
  key: string;
  algorithm?: 'AES' | 'DES';
}

declare function encrypt<T>(config: EncryptConfig): Plugin<T>;
```

### History Plugin

```typescript
interface HistoryPouch<T> extends Pouch<T> {
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
  history: T[];
  historyIndex: number;
}

interface HistoryConfig {
  maxSize?: number;
}

declare function history<T>(config?: HistoryConfig): Plugin<T>;
```

### Logger Plugin

```typescript
interface LoggerConfig {
  prefix?: string;
  level?: 'log' | 'info' | 'warn' | 'error';
  formatter?: (oldValue: any, newValue: any) => string;
}

declare function logger<T>(config?: LoggerConfig): Plugin<T>;
```

### Middleware Plugin

```typescript
type MiddlewareFn<T> = (
  newValue: T,
  oldValue: T,
  context: { pouch: Pouch<T> }
) => T | Promise<T>;

declare function middleware<T>(fn: MiddlewareFn<T>): Plugin<T>;
```

### Persist Plugin

```typescript
interface PersistConfig {
  key: string;
  storage?: Storage;
  serializer?: {
    parse: (value: string) => any;
    stringify: (value: any) => string;
  };
}

declare function persist<T>(
  key: string | PersistConfig
): Plugin<T>;
```

### React Native Persist Plugin

```typescript
interface RNPersistConfig {
  key: string;
  serializer?: {
    parse: (value: string) => any;
    stringify: (value: any) => string;
  };
}

declare function rnPersist<T>(
  key: string | RNPersistConfig
): Plugin<T>;
```

### Schema Plugin

```typescript
interface SchemaConfig<T> {
  validator: (value: any) => value is T;
  errorMessage?: string;
}

declare function schema<T>(config: SchemaConfig<T>): Plugin<T>;

// Common validators
declare const validators: {
  string: (value: any) => value is string;
  number: (value: any) => value is number;
  boolean: (value: any) => value is boolean;
  array: <T>(itemValidator: (item: any) => item is T) => (value: any) => value is T[];
  object: <T>(shape: { [K in keyof T]: (value: any) => value is T[K] }) => (value: any) => value is T;
};
```

### Sync Plugin

```typescript
interface SyncConfig<T> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  debounce?: number;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  transform?: (value: T) => any;
}

declare function sync<T>(
  endpoint: string | SyncConfig<T>
): Plugin<T>;
```

### Throttle Plugin

```typescript
interface ThrottleConfig {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

declare function throttle<T>(
  delay: number | ThrottleConfig
): Plugin<T>;
```

### Validate Plugin

```typescript
type ValidatorFn<T> = (value: T) => T | never;

interface ValidateConfig<T> {
  validator: ValidatorFn<T>;
  onError?: (error: Error) => void;
}

declare function validate<T>(
  validator: ValidatorFn<T> | ValidateConfig<T>
): Plugin<T>;
```

## Utility Types

### Plugin Composition

```typescript
type PluginArray<T> = Plugin<T>[];

type ExtractPluginExtensions<T, P extends PluginArray<T>> = 
  P extends [infer First, ...infer Rest]
    ? First extends Plugin<T>
      ? First extends { setup: (pouch: infer ExtendedPouch) => void }
        ? ExtendedPouch & ExtractPluginExtensions<T, Rest extends PluginArray<T> ? Rest : []>
        : ExtractPluginExtensions<T, Rest extends PluginArray<T> ? Rest : []>
      : ExtractPluginExtensions<T, Rest extends PluginArray<T> ? Rest : []>
    : {};

type EnhancedPouch<T, P extends PluginArray<T> = []> = 
  Pouch<T> & ExtractPluginExtensions<T, P>;
```

### State Update Types

```typescript
type StateUpdater<T> = T | ((prev: T) => T);

type Listener<T> = (value: T) => void;
type Unsubscribe = () => void;

type AsyncUpdater<T> = (value: T) => Promise<T>;
```

### Advanced Generic Constraints

```typescript
// For plugins that require specific value types
interface SerializablePlugin<T extends Record<string, any>> extends Plugin<T> {}

// For plugins that work with arrays
interface ArrayPlugin<T extends any[]> extends Plugin<T> {}

// For plugins that work with primitives
interface PrimitivePlugin<T extends string | number | boolean> extends Plugin<T> {}
```

## Type Guards

```typescript
// Check if a pouch has specific plugin extensions
function hasHistoryMethods<T>(pouch: Pouch<T>): pouch is HistoryPouch<T> {
  return 'undo' in pouch && 'redo' in pouch && 'canUndo' in pouch;
}

function hasComputedProperty<T>(pouch: Pouch<T>): pouch is ComputedPouch<T, any> {
  return 'computed' in pouch;
}

// Generic plugin detection
function hasPlugin<T>(pouch: Pouch<T>, pluginName: string): boolean {
  return pluginName in pouch;
}
```

## Generic Helpers

```typescript
// Extract the value type from a Pouch
type PouchValue<P> = P extends Pouch<infer T> ? T : never;

// Create a pouch type with specific plugins
type PouchWithPlugins<T, P extends string[]> = 
  P extends []
    ? Pouch<T>
    : P extends ['history', ...infer Rest]
      ? HistoryPouch<T> & PouchWithPlugins<T, Rest extends string[] ? Rest : []>
      : P extends ['computed', ...infer Rest]
        ? ComputedPouch<T, any> & PouchWithPlugins<T, Rest extends string[] ? Rest : []>
        : Pouch<T>;

// Usage examples
type MyPouch = PouchWithPlugins<number, ['history', 'computed']>;
// Results in: HistoryPouch<number> & ComputedPouch<number, any>
```

## React Integration Types

```typescript
// Hook return type
type UsePouchResult<T> = T;

// Component prop types for pouch values
interface PouchProps<T> {
  pouch: Pouch<T>;
  children: (value: T) => React.ReactNode;
}

// Higher-order component type
type WithPouch<T, P = {}> = (
  Component: React.ComponentType<P & { value: T }>
) => React.ComponentType<P & { pouch: Pouch<T> }>;
```

## Error Types

```typescript
interface PouchError extends Error {
  name: 'PouchError';
  cause?: Error;
  plugin?: string;
}

interface ValidationError extends PouchError {
  name: 'ValidationError';
  field?: string;
  value?: any;
}

interface PluginError extends PouchError {
  name: 'PluginError';
  pluginName: string;
  phase: 'initialize' | 'setup' | 'onSet';
}
```

## Advanced Usage Examples

```typescript
// Custom plugin with proper typing
function createCustomPlugin<T extends Record<string, any>>(
  config: { transform: (value: T) => T }
): Plugin<T> {
  return {
    name: 'custom',
    onSet: (newValue, oldValue) => config.transform(newValue)
  };
}

// Type-safe pouch creation with multiple plugins
function createTypedPouch<T>(initialValue: T) {
  return {
    withHistory: (maxSize = 10) => 
      pouch(initialValue, [history<T>({ maxSize })]) as HistoryPouch<T>,
    
    withPersist: (key: string) =>
      pouch(initialValue, [persist<T>(key)]),
    
    withValidation: (validator: (value: T) => T) =>
      pouch(initialValue, [validate<T>(validator)]),
    
    withAll: (key: string, validator: (value: T) => T) =>
      pouch(initialValue, [
        validate<T>(validator),
        history<T>(),
        persist<T>(key)
      ]) as HistoryPouch<T>
  };
}

// Usage
const userPouch = createTypedPouch({ name: '', age: 0 })
  .withAll('user', (user) => {
    if (user.age < 0) throw new Error('Invalid age');
    return user;
  });

// userPouch now has type: HistoryPouch<{name: string, age: number}>
userPouch.undo(); // ✅ TypeScript knows this method exists
userPouch.set({ name: 'John', age: 30 }); // ✅ Type-safe
```