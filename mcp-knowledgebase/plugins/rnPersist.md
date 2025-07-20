# RNPersist Plugin

The rnPersist plugin provides AsyncStorage persistence for React Native applications. It automatically saves pouch state to AsyncStorage and restores it when the app launches, with full async support.

## Import

```typescript
import { rnPersist } from 'react-pouch/plugins';
```

## Configuration Options

```typescript
interface RNPersistOptions {
  serialize?: (value: any) => string;      // Default: JSON.stringify with circular reference handling
  deserialize?: (str: string) => any;      // Default: JSON.parse
  asyncStorage?: {                         // Custom AsyncStorage implementation
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
}

rnPersist(key: string, options?: RNPersistOptions)
```

## Installation

First, install AsyncStorage:

```bash
npm install @react-native-async-storage/async-storage
# or
yarn add @react-native-async-storage/async-storage
```

For iOS, run:
```bash
cd ios && pod install
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { rnPersist } from 'react-pouch/plugins';

const userSettings = pouch(
  { theme: 'light', notifications: true },
  [
    rnPersist('user-settings')
  ]
);

// State is automatically saved to AsyncStorage
userSettings.set({ theme: 'dark', notifications: true });

// On app restart, state is restored from AsyncStorage
```

### With Custom AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const customPouch = pouch(
  { data: [] },
  [
    rnPersist('custom-data', {
      asyncStorage: AsyncStorage  // Explicitly pass AsyncStorage
    })
  ]
);
```

### With Custom Serialization

```typescript
interface AppData {
  lastOpened: Date;
  coordinates: { lat: number; lng: number };
  settings: Map<string, any>;
}

const appData = pouch<AppData>(
  { 
    lastOpened: new Date(), 
    coordinates: { lat: 0, lng: 0 },
    settings: new Map()
  },
  [
    rnPersist('app-data', {
      serialize: (value) => JSON.stringify({
        ...value,
        lastOpened: value.lastOpened.toISOString(),
        settings: Array.from(value.settings.entries())
      }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          lastOpened: new Date(parsed.lastOpened),
          settings: new Map(parsed.settings)
        };
      }
    })
  ]
);
```

## API Methods

### `getStorageInfo()`

Returns information about the storage status:

```typescript
const info = pouch.getStorageInfo();
// {
//   key: 'user-settings',
//   available: true,
//   type: 'AsyncStorage'
// }
```

### `clearStorage()`

Clears the persisted data:

```typescript
await pouch.clearStorage();
```

## Common Use Cases

### 1. User Preferences in React Native

```typescript
interface Preferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

const preferences = pouch<Preferences>(
  {
    theme: 'system',
    language: 'en',
    fontSize: 16,
    notifications: {
      enabled: true,
      sound: true,
      vibration: true
    }
  },
  [
    rnPersist('user-preferences'),
    logger('Preferences')
  ]
);

// Usage in component
const PreferencesScreen = () => {
  const [prefs] = preferences.use();
  
  return (
    <View>
      <Switch
        value={prefs.notifications.enabled}
        onValueChange={(enabled) => 
          preferences.set(current => ({
            ...current,
            notifications: { ...current.notifications, enabled }
          }))
        }
      />
    </View>
  );
};
```

### 2. Offline Data Cache

```typescript
interface CachedData {
  posts: Array<{ id: string; title: string; cached: boolean }>;
  lastSync: string;
  pendingUploads: string[];
}

const offlineCache = pouch<CachedData>(
  { posts: [], lastSync: '', pendingUploads: [] },
  [
    rnPersist('offline-cache'),
    middleware((data) => ({
      ...data,
      posts: data.posts.map(post => ({ ...post, cached: true }))
    }))
  ]
);

// Sync when online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    const { pendingUploads } = offlineCache.get();
    // Process pending uploads
  }
});
```

### 3. Authentication State

```typescript
interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  refreshToken: string | null;
  user: { id: string; name: string; email: string } | null;
  biometricEnabled: boolean;
}

const authState = pouch<AuthState>(
  { 
    isLoggedIn: false, 
    token: null, 
    refreshToken: null, 
    user: null,
    biometricEnabled: false
  },
  [
    rnPersist('auth-state'),
    middleware((state) => {
      // Clear tokens if logged out
      if (!state.isLoggedIn) {
        return { ...state, token: null, refreshToken: null };
      }
      return state;
    })
  ]
);
```

### 4. App Onboarding Progress

```typescript
interface OnboardingState {
  completed: boolean;
  currentStep: number;
  steps: {
    welcome: boolean;
    permissions: boolean;
    profile: boolean;
    preferences: boolean;
  };
  skipped: boolean;
}

const onboarding = pouch<OnboardingState>(
  {
    completed: false,
    currentStep: 0,
    steps: {
      welcome: false,
      permissions: false,
      profile: false,
      preferences: false
    },
    skipped: false
  },
  [
    rnPersist('onboarding-progress'),
    computed((state) => ({
      progress: Object.values(state.steps).filter(Boolean).length / 4,
      canComplete: Object.values(state.steps).every(Boolean)
    }))
  ]
);
```

### 5. Shopping Cart

```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const shoppingCart = pouch<CartItem[]>(
  [],
  [
    rnPersist('shopping-cart'),
    computed((items) => ({
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      isEmpty: items.length === 0
    }))
  ]
);

// Clear cart after purchase
const completePurchase = async () => {
  await shoppingCart.clearStorage();
  shoppingCart.set([]);
};
```

### 6. Form Drafts

```typescript
interface FormDraft {
  title: string;
  description: string;
  images: string[];
  category: string;
  savedAt: string;
}

const draftPouch = pouch<FormDraft>(
  { title: '', description: '', images: [], category: '', savedAt: '' },
  [
    debounce(2000),  // Auto-save after 2 seconds
    middleware((draft) => ({
      ...draft,
      savedAt: new Date().toISOString()
    })),
    rnPersist('form-draft')
  ]
);

// Clear draft on successful submission
const submitForm = async () => {
  // Submit logic...
  await draftPouch.clearStorage();
  draftPouch.set({ title: '', description: '', images: [], category: '', savedAt: '' });
};
```

### 7. App Settings with Migration

```typescript
interface AppSettings {
  version: number;
  settings: any;
}

const settings = pouch<AppSettings>(
  { version: 2, settings: {} },
  [
    rnPersist('app-settings', {
      deserialize: (str) => {
        const stored = JSON.parse(str);
        
        // Migrate from v1 to v2
        if (stored.version === 1) {
          return {
            version: 2,
            settings: migrateSettingsV1ToV2(stored.settings)
          };
        }
        
        return stored;
      }
    })
  ]
);
```

### 8. Location History

```typescript
interface LocationEntry {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

const locationHistory = pouch<LocationEntry[]>(
  [],
  [
    rnPersist('location-history', {
      serialize: (locations) => {
        // Keep only last 100 locations
        const recent = locations.slice(-100);
        return JSON.stringify(recent);
      }
    }),
    middleware((locations) => {
      // Sort by timestamp
      return [...locations].sort((a, b) => a.timestamp - b.timestamp);
    })
  ]
);
```

## AsyncStorage Considerations

### Storage Limits
- AsyncStorage has a default limit of 6MB on Android
- iOS has a higher limit but varies by device
- Consider implementing data cleanup strategies

### Performance Tips
1. Keep data size minimal
2. Avoid storing large binary data (use file system instead)
3. Batch operations when possible
4. Consider using `multiGet`/`multiSet` for bulk operations

### Error Handling
The plugin handles errors gracefully:
- Storage quota exceeded
- Invalid JSON
- AsyncStorage not available
- Permission issues

## Notes

- Loading from AsyncStorage is asynchronous and happens after pouch creation
- Saving is also asynchronous but doesn't block state updates
- The plugin works with any AsyncStorage-compatible implementation
- Use `getStorageInfo()` to check if AsyncStorage is available
- `clearStorage()` returns a Promise for async cleanup
- Consider using with `encrypt` plugin for sensitive data
- The plugin handles circular references automatically
- For web, use the regular `persist` plugin instead
- AsyncStorage operations are automatically batched for performance