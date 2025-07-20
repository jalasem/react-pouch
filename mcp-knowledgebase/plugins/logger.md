# Logger Plugin

The logger plugin provides console logging for state changes, making it easy to debug and monitor your application's state management. It displays previous and current values with optional grouping and timestamps.

## Import

```typescript
import { logger } from 'react-pouch/plugins';
```

## Configuration Options

```typescript
interface LoggerOptions {
  collapsed?: boolean;    // Collapse log groups (default: false)
  timestamp?: boolean;    // Include timestamp (default: true)
}

logger(name: string, options?: LoggerOptions)
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { logger } from 'react-pouch/plugins';

const userPouch = pouch(
  { name: 'John', age: 30 },
  [
    logger('UserState')
  ]
);

// Logs initialization:
// [UserState] Pouch initialized with: { name: 'John', age: 30 }

userPouch.set({ name: 'Jane', age: 25 });
// Logs state change:
// [UserState] State Change 2024-01-20T10:30:00.000Z
//   Previous: { name: 'John', age: 30 }
//   Current: { name: 'Jane', age: 25 }
//   Type: object
```

### With Options

```typescript
const cartPouch = pouch(
  { items: [], total: 0 },
  [
    logger('ShoppingCart', {
      collapsed: true,      // Collapsed groups for cleaner console
      timestamp: false      // No timestamps
    })
  ]
);

// Produces collapsed log groups without timestamps
```

### Development-Only Logging

```typescript
const statePouch = pouch(initialState, [
  ...(process.env.NODE_ENV === 'development' 
    ? [logger('AppState', { collapsed: true })] 
    : [])
]);
```

## API Methods

This plugin doesn't add any methods to the pouch instance. It works by intercepting state changes and logging them to the console.

## Common Use Cases

### 1. Debugging State Changes

```typescript
const formPouch = pouch(
  { 
    fields: {
      username: '',
      email: '',
      password: ''
    },
    errors: {},
    isSubmitting: false
  },
  [
    logger('FormDebug', { collapsed: false })  // Expanded for detailed debugging
  ]
);

// Every field change is logged with full state visibility
```

### 2. Monitoring User Actions

```typescript
interface UserAction {
  type: string;
  payload: any;
  timestamp: Date;
  userId: string;
}

const actionsPouch = pouch<UserAction[]>([], [
  logger('UserActions'),
  computed((actions) => ({
    totalActions: actions.length,
    lastAction: actions[actions.length - 1]?.type || 'none',
    uniqueUsers: new Set(actions.map(a => a.userId)).size
  }))
]);
```

### 3. Performance Monitoring

```typescript
const performancePouch = pouch(
  { 
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  },
  [
    logger('Performance', { 
      collapsed: true,
      timestamp: true  // Timestamps help track performance over time
    })
  ]
);
```

### 4. Redux DevTools Alternative

```typescript
// Logger provides similar debugging capabilities to Redux DevTools
const appState = pouch(
  {
    user: null,
    posts: [],
    ui: { theme: 'light', sidebarOpen: true }
  },
  [
    logger('AppState', { collapsed: true }),
    history(50)  // Combine with history for time-travel debugging
  ]
);
```

### 5. Tracking API Interactions

```typescript
interface ApiState {
  endpoint: string;
  method: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data: any;
  error: any;
}

const apiPouch = pouch<ApiState>(
  { endpoint: '', method: 'GET', status: 'idle', data: null, error: null },
  [
    logger('API', { timestamp: true }),
    sync('/api/log', {  // Also send logs to server
      method: 'POST'
    })
  ]
);
```

### 6. Multi-Module Logging

```typescript
// Create a logger factory for consistent formatting
const createModulePouch = <T>(
  moduleName: string, 
  initialState: T,
  plugins: any[] = []
) => {
  return pouch(initialState, [
    logger(`Module:${moduleName}`, { 
      collapsed: true,
      timestamp: true 
    }),
    ...plugins
  ]);
};

// Use across modules
const authPouch = createModulePouch('Auth', { user: null, token: '' });
const cartPouch = createModulePouch('Cart', { items: [], total: 0 });
const uiPouch = createModulePouch('UI', { theme: 'light', loading: false });
```

### 7. Conditional Logging

```typescript
interface DebugConfig {
  logLevel: 'none' | 'basic' | 'verbose';
  modules: string[];
}

const debugConfig: DebugConfig = {
  logLevel: 'verbose',
  modules: ['auth', 'cart']
};

const createPouch = <T>(name: string, initial: T, plugins: any[] = []) => {
  const shouldLog = debugConfig.logLevel !== 'none' && 
                   debugConfig.modules.includes(name.toLowerCase());
  
  return pouch(initial, [
    ...(shouldLog ? [logger(name, {
      collapsed: debugConfig.logLevel === 'basic'
    })] : []),
    ...plugins
  ]);
};
```

### 8. Error Tracking

```typescript
interface ErrorState {
  message: string;
  stack?: string;
  component?: string;
  timestamp: Date;
}

const errorPouch = pouch<ErrorState[]>([], [
  logger('Errors', { collapsed: false }),  // Always expanded for errors
  middleware((errors) => {
    // Log to external service when errors are added
    if (errors.length > 0) {
      console.error('New error logged:', errors[errors.length - 1]);
    }
    return errors;
  })
]);
```

## Console Output Format

The logger produces structured console output:

```
[PouchName] Pouch initialized with: <initial-value>

[PouchName] State Change 2024-01-20T10:30:00.000Z
  Previous: <old-value>
  Current: <new-value>
  Type: <typeof-value>
```

When `collapsed: true`, the state change information is in a collapsed group that can be expanded in the console.

## Notes

- Logger only outputs to the console; it doesn't affect state behavior
- Use collapsed mode for production or when dealing with frequent updates
- Timestamps are in ISO format for easy parsing and sorting
- The logger shows the JavaScript type of the current value
- Large objects are fully expanded in the console for inspection
- Consider disabling in production for performance and security
- Works in both browser and Node.js environments
- Can be combined with other debugging tools and plugins
- The initialization log helps track when pouches are created