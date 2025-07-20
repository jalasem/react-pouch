# Persist Plugin

The persist plugin automatically saves pouch state to browser storage (localStorage or sessionStorage) and restores it when the application reloads. This provides seamless state persistence across browser sessions.

## Import

```typescript
import { persist } from 'react-pouch/plugins';
```

## Configuration Options

```typescript
interface PersistOptions {
  storage?: 'localStorage' | 'sessionStorage';  // Default: 'localStorage'
  serialize?: (value: any) => string;           // Default: JSON.stringify with circular reference handling
  deserialize?: (value: string) => any;         // Default: JSON.parse
}

persist(key: string, options?: PersistOptions)
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { persist } from 'react-pouch/plugins';

const userPreferences = pouch(
  { theme: 'light', language: 'en' },
  [
    persist('user-preferences')  // Saves to localStorage
  ]
);

// State is automatically saved on every change
userPreferences.set({ theme: 'dark', language: 'en' });

// On page reload, state is restored from localStorage
```

### With Session Storage

```typescript
const sessionData = pouch(
  { token: '', user: null },
  [
    persist('session-data', { 
      storage: 'sessionStorage'  // Clears when browser closes
    })
  ]
);
```

### Custom Serialization

```typescript
const complexData = pouch(
  { date: new Date(), regex: /pattern/g, map: new Map() },
  [
    persist('complex-data', {
      serialize: (value) => {
        // Custom serialization for complex types
        return JSON.stringify({
          ...value,
          date: value.date.toISOString(),
          regex: value.regex.toString(),
          map: Array.from(value.map.entries())
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          date: new Date(parsed.date),
          regex: new RegExp(parsed.regex.slice(1, -2), parsed.regex.slice(-1)),
          map: new Map(parsed.map)
        };
      }
    })
  ]
);
```

## API Methods

This plugin doesn't add any methods to the pouch instance. It works automatically by intercepting state changes and initialization.

## Common Use Cases

### 1. User Preferences

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  notifications: boolean;
  language: string;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

const settings = pouch<UserSettings>(
  {
    theme: 'auto',
    fontSize: 16,
    notifications: true,
    language: 'en',
    accessibility: {
      highContrast: false,
      reducedMotion: false
    }
  },
  [
    persist('app-settings'),
    logger('Settings', { collapsed: true })
  ]
);
```

### 2. Shopping Cart Persistence

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const shoppingCart = pouch<CartItem[]>(
  [],
  [
    persist('shopping-cart'),
    computed((items) => ({
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      count: items.reduce((sum, item) => sum + item.quantity, 0)
    }))
  ]
);
```

### 3. Form Draft Auto-save

```typescript
interface BlogPost {
  title: string;
  content: string;
  tags: string[];
  isDraft: boolean;
  lastSaved: string;
}

const draftPost = pouch<BlogPost>(
  { title: '', content: '', tags: [], isDraft: true, lastSaved: '' },
  [
    debounce(1000),  // Auto-save after 1 second of inactivity
    middleware((post) => ({
      ...post,
      lastSaved: new Date().toISOString()
    })),
    persist('blog-draft')
  ]
);
```

### 4. Authentication State

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  refreshToken: string | null;
}

const auth = pouch<AuthState>(
  { isAuthenticated: false, user: null, token: null, refreshToken: null },
  [
    persist('auth-state'),
    middleware((state) => {
      // Clear sensitive data if not authenticated
      if (!state.isAuthenticated) {
        return {
          ...state,
          token: null,
          refreshToken: null,
          user: null
        };
      }
      return state;
    })
  ]
);
```

### 5. Multi-tab Synchronization

```typescript
const sharedState = pouch(
  { activeTab: 'home', notifications: [] },
  [
    persist('shared-state')
  ]
);

// Listen for storage events to sync between tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'shared-state' && e.newValue) {
    try {
      const newState = JSON.parse(e.newValue);
      sharedState.set(newState);
    } catch (error) {
      console.error('Failed to sync state:', error);
    }
  }
});
```

### 6. Versioned Storage

```typescript
interface VersionedState {
  version: number;
  data: any;
}

const versionedPouch = pouch<VersionedState>(
  { version: 1, data: {} },
  [
    persist('app-data', {
      deserialize: (str) => {
        const stored = JSON.parse(str);
        
        // Handle migration from old versions
        if (stored.version < 1) {
          return {
            version: 1,
            data: migrateV0ToV1(stored.data)
          };
        }
        
        return stored;
      }
    })
  ]
);
```

### 7. Encrypted Storage

```typescript
import { encrypt } from 'react-pouch/plugins';

const secureData = pouch(
  { apiKey: '', secret: '', credentials: {} },
  [
    encrypt('my-secret-key'),  // Encrypt first
    persist('secure-data')      // Then persist encrypted data
  ]
);
```

### 8. Storage with Expiry

```typescript
interface ExpiringData<T> {
  value: T;
  expiry: number;
}

function persistWithExpiry<T>(key: string, ttlMs: number) {
  return persist(key, {
    serialize: (value: T) => JSON.stringify({
      value,
      expiry: Date.now() + ttlMs
    }),
    deserialize: (str: string) => {
      const stored: ExpiringData<T> = JSON.parse(str);
      
      // Check if expired
      if (Date.now() > stored.expiry) {
        localStorage.removeItem(key);
        return null; // Return null or default value
      }
      
      return stored.value;
    }
  });
}

const tempData = pouch(
  { sessionToken: '', tempFiles: [] },
  [
    persistWithExpiry('temp-data', 3600000)  // Expires in 1 hour
  ]
);
```

## Storage Limits and Considerations

### Storage Quotas
- localStorage: typically 5-10MB per origin
- sessionStorage: typically 5-10MB per origin
- Consider data size when persisting large objects

### Error Handling
The plugin handles common errors gracefully:
- Storage quota exceeded
- Invalid JSON
- Storage not available (private browsing)
- Circular references (handled by safe stringify)

### Performance Tips
1. Keep persisted data minimal
2. Use sessionStorage for temporary data
3. Consider compressing large data
4. Implement cleanup strategies for old data

## Notes

- The persist plugin automatically handles circular references using a WeakSet
- Data is loaded synchronously on pouch initialization
- Storage errors are logged but don't break the application
- Works only in browser environments (typeof window !== 'undefined')
- For React Native, use the `rnPersist` plugin instead
- Order matters: place persist after transforming plugins like `encrypt`
- Storage events enable multi-tab synchronization
- Consider GDPR/privacy when persisting user data
- Use custom serialization for non-JSON types (Date, RegExp, Map, Set)