# React Pouch Core API Reference

## Creating a Pouch

### `pouch<T>(initialValue: T, plugins?: Plugin<T>[]): Pouch<T>`

Creates a new pouch instance with the specified initial value and optional plugins.

```typescript
import { pouch } from 'react-pouch';

// Basic pouch
const counter = pouch(0);

// Pouch with plugins
const user = pouch({ name: '', email: '' }, [logger(), persist('user')]);
```

## Pouch Instance Methods

### `get(): T`

Returns the current value of the pouch.

```typescript
const value = counter.get(); // 0
```

### `set(value: T | ((prev: T) => T)): void`

Updates the pouch value. Accepts either a new value or a function that receives the current value and returns the new value.

```typescript
// Direct value
counter.set(5);

// Function update
counter.set(prev => prev + 1);
```

### `subscribe(listener: (value: T) => void): () => void`

Subscribes to value changes. Returns an unsubscribe function.

```typescript
const unsubscribe = counter.subscribe(value => {
  console.log('New value:', value);
});

// Later...
unsubscribe();
```

### `use(): T`

React hook that subscribes to the pouch and returns the current value. Automatically handles cleanup on unmount.

```typescript
function Counter() {
  const count = counter.use();
  return <div>Count: {count}</div>;
}
```

## Type Definitions

```typescript
interface Pouch<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(listener: (value: T) => void): () => void;
  use(): T;
  [key: string]: any; // Plugin extensions
}

interface Plugin<T> {
  name: string;
  initialize?: (value: T) => T;
  setup?: (pouch: Pouch<T>) => void;
  onSet?: (newValue: T, oldValue: T) => T | void;
}
```

## Advanced Usage

### Functional Updates

```typescript
const todos = pouch<Todo[]>([]);

// Add todo
todos.set(prev => [...prev, newTodo]);

// Update specific todo
todos.set(prev => 
  prev.map(todo => 
    todo.id === id ? { ...todo, completed: true } : todo
  )
);
```

### Multiple Subscriptions

```typescript
// Multiple components can subscribe
const unsubscribe1 = user.subscribe(handleUserChange1);
const unsubscribe2 = user.subscribe(handleUserChange2);

// All subscribers notified on change
user.set({ name: 'John', email: 'john@example.com' });
```

### Plugin Chaining

```typescript
const enhanced = pouch(0, [
  validate(v => v >= 0),
  logger(),
  persist('counter')
]);

// Plugins execute in order:
// 1. validate checks value
// 2. logger logs the change
// 3. persist saves to storage
```