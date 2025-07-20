# Getting Started with React Pouch

## Installation

```bash
npm install react-pouch
# or
yarn add react-pouch
```

## Basic Usage

### Simple Counter

```typescript
import { pouch } from 'react-pouch';

// Create a counter pouch
const counter = pouch(0);

function Counter() {
  const count = counter.use();
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.set(count + 1)}>+</button>
      <button onClick={() => counter.set(count - 1)}>-</button>
    </div>
  );
}
```

### Object State

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const user = pouch<User>({
  name: '',
  email: '',
  age: 0
});

function UserProfile() {
  const userData = user.use();
  
  const updateName = (name: string) => {
    user.set(prev => ({ ...prev, name }));
  };
  
  return (
    <form>
      <input 
        value={userData.name}
        onChange={(e) => updateName(e.target.value)}
        placeholder="Name"
      />
      <input 
        value={userData.email}
        onChange={(e) => user.set(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
    </form>
  );
}
```

## With Plugins

### Persistent Counter

```typescript
import { pouch } from 'react-pouch';
import { persist } from 'react-pouch/plugins';

const counter = pouch(0, [persist('counter')]);

// Counter value is automatically saved to localStorage
// and restored on page reload
```

### Validated User Form

```typescript
import { validate, logger } from 'react-pouch/plugins';

const user = pouch<User>({
  name: '',
  email: '',
  age: 0
}, [
  validate(user => {
    if (!user.name) throw new Error('Name is required');
    if (!user.email.includes('@')) throw new Error('Invalid email');
    if (user.age < 0) throw new Error('Age must be positive');
    return user;
  }),
  logger()
]);

function UserForm() {
  const userData = user.use();
  
  const handleSubmit = () => {
    try {
      user.set({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    } catch (error) {
      console.error('Validation failed:', error.message);
    }
  };
  
  return (
    <button onClick={handleSubmit}>
      Update User
    </button>
  );
}
```

## Multiple Components

```typescript
const theme = pouch<'light' | 'dark'>('light');

function ThemeToggle() {
  const currentTheme = theme.use();
  
  return (
    <button onClick={() => theme.set(currentTheme === 'light' ? 'dark' : 'light')}>
      {currentTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function App() {
  const currentTheme = theme.use();
  
  return (
    <div className={`app ${currentTheme}`}>
      <ThemeToggle />
      <main>Content goes here...</main>
    </div>
  );
}
```

## Subscription Outside React

```typescript
const notifications = pouch<string[]>([]);

// Subscribe to changes outside React
const unsubscribe = notifications.subscribe(items => {
  console.log('Notifications updated:', items);
  
  // Update browser notification badge
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(items.length);
  }
});

// Add notification
notifications.set(prev => [...prev, 'New message']);

// Cleanup when done
// unsubscribe();
```

## Best Practices

### 1. Create Pouches Outside Components

```typescript
// ✅ Good - create outside component
const userSettings = pouch({ theme: 'light', lang: 'en' });

function Settings() {
  const settings = userSettings.use();
  // ...
}
```

```typescript
// ❌ Bad - creates new pouch on every render
function Settings() {
  const settings = pouch({ theme: 'light', lang: 'en' }).use();
  // ...
}
```

### 2. Use Functional Updates for Complex State

```typescript
const todos = pouch<Todo[]>([]);

// ✅ Good - functional update
const toggleTodo = (id: string) => {
  todos.set(prev => 
    prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};
```

### 3. Combine Related Plugins

```typescript
const userData = pouch(defaultUser, [
  validate(validateUser),
  persist('user'),
  logger()
]);
```

### 4. Handle Errors Gracefully

```typescript
const safeUpdate = (newData: User) => {
  try {
    user.set(newData);
  } catch (error) {
    console.error('Update failed:', error);
    // Show user-friendly error message
  }
};
```