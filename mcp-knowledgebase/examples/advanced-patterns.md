# Advanced React Pouch Patterns

## Complex State Management

### Nested State Updates

```typescript
interface AppState {
  user: {
    profile: { name: string; email: string };
    preferences: { theme: string; notifications: boolean };
  };
  ui: {
    loading: boolean;
    modal: { open: boolean; content: string };
  };
}

const appState = pouch<AppState>({
  user: {
    profile: { name: '', email: '' },
    preferences: { theme: 'light', notifications: true }
  },
  ui: {
    loading: false,
    modal: { open: false, content: '' }
  }
});

// Helper functions for specific updates
const updateUserProfile = (updates: Partial<AppState['user']['profile']>) => {
  appState.set(prev => ({
    ...prev,
    user: {
      ...prev.user,
      profile: { ...prev.user.profile, ...updates }
    }
  }));
};

const setLoading = (loading: boolean) => {
  appState.set(prev => ({
    ...prev,
    ui: { ...prev.ui, loading }
  }));
};

const openModal = (content: string) => {
  appState.set(prev => ({
    ...prev,
    ui: {
      ...prev.ui,
      modal: { open: true, content }
    }
  }));
};
```

### Multiple Pouch Coordination

```typescript
const user = pouch<User | null>(null);
const cart = pouch<CartItem[]>([]);
const orders = pouch<Order[]>([]);

// Clear cart when user logs out
user.subscribe(currentUser => {
  if (!currentUser) {
    cart.set([]);
    orders.set([]);
  }
});

// Auto-save cart changes for logged-in users
const cartWithPersist = pouch([], [
  persist('cart'),
  middleware((newCart, oldCart, { pouch }) => {
    const currentUser = user.get();
    if (currentUser && newCart.length !== oldCart.length) {
      // Trigger save to backend
      saveCartToServer(currentUser.id, newCart);
    }
    return newCart;
  })
]);
```

## Plugin Composition Patterns

### Custom Plugin Factory

```typescript
function createAuditPlugin<T>(userId: string) {
  return {
    name: 'audit',
    onSet: (newValue: T, oldValue: T) => {
      fetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          timestamp: Date.now(),
          oldValue,
          newValue
        })
      });
      return newValue;
    }
  };
}

const userSettings = pouch(defaultSettings, [
  validate(validateSettings),
  createAuditPlugin(currentUserId),
  persist('settings')
]);
```

### Conditional Plugin Loading

```typescript
function createProductionPlugins<T>(): Plugin<T>[] {
  const plugins: Plugin<T>[] = [validate(validateData)];
  
  if (process.env.NODE_ENV === 'development') {
    plugins.push(logger());
  }
  
  if (typeof window !== 'undefined') {
    plugins.push(persist('data'));
  }
  
  return plugins;
}

const data = pouch(initialData, createProductionPlugins());
```

## Performance Optimization

### Selective Component Updates

```typescript
const appData = pouch({
  users: [],
  posts: [],
  comments: [],
  ui: { loading: false, error: null }
});

// Component only re-renders when users change
function UserList() {
  const users = appData.use().users;
  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}

// Or use computed for derived state
const userCount = pouch(0, [
  computed(() => appData.get().users.length)
]);

function UserCount() {
  const count = userCount.use();
  return <span>Total users: {count}</span>;
}
```

### Debounced Search

```typescript
const searchQuery = pouch('', [debounce(300)]);
const searchResults = pouch<SearchResult[]>([]);

searchQuery.subscribe(async (query) => {
  if (query.length > 2) {
    const results = await searchAPI(query);
    searchResults.set(results);
  } else {
    searchResults.set([]);
  }
});

function SearchBox() {
  const query = searchQuery.use();
  const results = searchResults.use();
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => searchQuery.set(e.target.value)}
        placeholder="Search..."
      />
      <SearchResults results={results} />
    </div>
  );
}
```

## Error Handling Patterns

### Global Error Boundary

```typescript
const globalErrors = pouch<Error[]>([]);

const errorPlugin = {
  name: 'errorHandler',
  onSet: (newValue: any, oldValue: any) => {
    try {
      return newValue;
    } catch (error) {
      globalErrors.set(prev => [...prev, error]);
      return oldValue; // Revert to previous value
    }
  }
};

// Use with all critical pouches
const criticalData = pouch(initialData, [
  validate(validateData),
  errorPlugin,
  persist('critical')
]);

function ErrorDisplay() {
  const errors = globalErrors.use();
  
  if (errors.length === 0) return null;
  
  return (
    <div className="error-banner">
      {errors[errors.length - 1].message}
      <button onClick={() => globalErrors.set([])}>Dismiss</button>
    </div>
  );
}
```

### Retry Logic

```typescript
function createRetryPlugin<T>(maxRetries = 3): Plugin<T> {
  return {
    name: 'retry',
    setup: (pouch) => {
      let retryCount = 0;
      
      pouch.setWithRetry = async (updater: (prev: T) => Promise<T>) => {
        while (retryCount < maxRetries) {
          try {
            const currentValue = pouch.get();
            const newValue = await updater(currentValue);
            pouch.set(newValue);
            retryCount = 0; // Reset on success
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      };
    }
  };
}

const userData = pouch(initialUser, [createRetryPlugin(3)]);

// Usage with retry
await userData.setWithRetry(async (user) => {
  const updated = await updateUserOnServer(user);
  return updated;
});
```

## Testing Patterns

### Mock Plugins for Testing

```typescript
const createMockPersistPlugin = (): Plugin<any> => {
  const storage = new Map();
  
  return {
    name: 'mockPersist',
    initialize: (value) => {
      const key = 'test-key';
      const stored = storage.get(key);
      return stored ? JSON.parse(stored) : value;
    },
    onSet: (newValue) => {
      storage.set('test-key', JSON.stringify(newValue));
      return newValue;
    }
  };
};

// In tests
describe('User Settings', () => {
  let settings: Pouch<UserSettings>;
  
  beforeEach(() => {
    settings = pouch(defaultSettings, [
      validate(validateSettings),
      createMockPersistPlugin()
    ]);
  });
  
  it('should persist settings', () => {
    settings.set({ theme: 'dark', lang: 'es' });
    
    // Create new instance to test persistence
    const newSettings = pouch(defaultSettings, [createMockPersistPlugin()]);
    expect(newSettings.get().theme).toBe('dark');
  });
});
```

### Testing State Changes

```typescript
function createTestablePouch<T>(initialValue: T) {
  const changes: Array<{ oldValue: T; newValue: T; timestamp: number }> = [];
  
  const pouch = createPouch(initialValue, [
    {
      name: 'test-tracker',
      onSet: (newValue, oldValue) => {
        changes.push({ 
          oldValue, 
          newValue, 
          timestamp: Date.now() 
        });
        return newValue;
      }
    }
  ]);
  
  return {
    ...pouch,
    getChanges: () => changes,
    clearChanges: () => changes.length = 0
  };
}

// Usage in tests
const testPouch = createTestablePouch(0);
testPouch.set(5);
testPouch.set(10);

expect(testPouch.getChanges()).toHaveLength(2);
expect(testPouch.getChanges()[0].newValue).toBe(5);
```

## Integration Patterns

### React Router Integration

```typescript
const routerState = pouch({
  currentPath: '/',
  params: {},
  query: {}
});

// Update pouch when route changes
function RouteSync() {
  const location = useLocation();
  
  useEffect(() => {
    routerState.set({
      currentPath: location.pathname,
      params: location.state || {},
      query: Object.fromEntries(new URLSearchParams(location.search))
    });
  }, [location]);
  
  return null;
}

// Navigate programmatically
const navigate = useNavigate();
routerState.subscribe((state) => {
  if (state.currentPath !== window.location.pathname) {
    navigate(state.currentPath, { state: state.params });
  }
});
```

### Form State Management

```typescript
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

function createFormPouch<T extends Record<string, any>>(
  initialValues: T,
  validator?: (values: T) => Partial<Record<keyof T, string>>
) {
  const formState = pouch<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false
  });
  
  return {
    ...formState,
    setField: (field: keyof T, value: T[keyof T]) => {
      formState.set(prev => {
        const newValues = { ...prev.values, [field]: value };
        const errors = validator ? validator(newValues) : {};
        
        return {
          ...prev,
          values: newValues,
          errors,
          touched: { ...prev.touched, [field]: true }
        };
      });
    },
    
    submit: async (onSubmit: (values: T) => Promise<void>) => {
      const { values } = formState.get();
      const errors = validator ? validator(values) : {};
      
      if (Object.keys(errors).length > 0) {
        formState.set(prev => ({ ...prev, errors }));
        return;
      }
      
      formState.set(prev => ({ ...prev, isSubmitting: true }));
      
      try {
        await onSubmit(values);
      } finally {
        formState.set(prev => ({ ...prev, isSubmitting: false }));
      }
    }
  };
}

// Usage
const userForm = createFormPouch(
  { name: '', email: '', age: 0 },
  (values) => {
    const errors: any = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email.includes('@')) errors.email = 'Invalid email';
    return errors;
  }
);
```