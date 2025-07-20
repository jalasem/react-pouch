# Sync Plugin

The sync plugin enables automatic synchronization of pouch state with a remote server. It fetches initial data on setup and sends updates whenever the state changes, with built-in debouncing and error handling.

## Import

```typescript
import { sync } from 'react-pouch/plugins';
```

## Configuration Options

```typescript
interface SyncOptions {
  debounce?: number;                              // Delay before sending updates (default: 500ms)
  onError?: (error: Error) => void;              // Error handler (default: console.error)
  headers?: Record<string, string>;               // Additional headers
  credentials?: 'include' | 'omit' | 'same-origin';  // Fetch credentials
  method?: string;                                // HTTP method override
  mode?: 'cors' | 'no-cors' | 'same-origin';     // Fetch mode
  [key: string]: any;                             // Additional fetch options
}

sync(url: string, options?: SyncOptions)
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { sync } from 'react-pouch/plugins';

const userProfile = pouch(
  { name: '', email: '', preferences: {} },
  [
    sync('https://api.example.com/user/profile')
  ]
);

// Initial data is fetched from the server on setup
// Updates are automatically sent via POST when state changes
```

### With Authentication

```typescript
const authenticatedData = pouch(
  { data: null },
  [
    sync('https://api.example.com/data', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-API-Key': apiKey
      },
      credentials: 'include'  // Include cookies
    })
  ]
);
```

### Custom Error Handling

```typescript
const syncedState = pouch(
  { items: [] },
  [
    sync('https://api.example.com/items', {
      debounce: 1000,  // Wait 1 second before syncing
      onError: (error) => {
        console.error('Sync failed:', error);
        // Show user notification
        showToast('Failed to sync data. Please check your connection.');
      }
    })
  ]
);
```

## API Methods

This plugin doesn't add any methods to the pouch instance. It works automatically by intercepting initialization and state changes.

## Common Use Cases

### 1. User Settings Synchronization

```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
  };
}

const settings = pouch<UserSettings>(
  {
    theme: 'auto',
    language: 'en',
    notifications: { email: true, push: true, sms: false },
    privacy: { profileVisibility: 'friends', showEmail: false }
  },
  [
    sync('/api/user/settings', {
      debounce: 1000,
      headers: { 'Authorization': `Bearer ${token}` },
      onError: (error) => {
        // Fallback to local storage on error
        console.warn('Settings sync failed, using local cache', error);
      }
    }),
    persist('user-settings-cache')  // Local backup
  ]
);
```

### 2. Real-time Collaboration

```typescript
interface DocumentState {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  collaborators: string[];
}

const sharedDocument = pouch<DocumentState>(
  { id: '', title: '', content: '', lastModified: '', collaborators: [] },
  [
    sync(`/api/documents/${documentId}`, {
      debounce: 300,  // Fast sync for collaboration
      method: 'PATCH',  // Use PATCH for partial updates
      headers: {
        'X-Session-ID': sessionId,
        'X-User-ID': userId
      }
    }),
    logger('Document', { collapsed: true })
  ]
);

// Periodic polling for updates from other users
setInterval(async () => {
  try {
    const response = await fetch(`/api/documents/${documentId}`);
    const data = await response.json();
    
    // Only update if server version is newer
    if (data.lastModified > sharedDocument.get().lastModified) {
      sharedDocument.set(data);
    }
  } catch (error) {
    console.error('Polling failed:', error);
  }
}, 5000);
```

### 3. Shopping Cart Sync

```typescript
interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

const shoppingCart = pouch<CartItem[]>(
  [],
  [
    sync('/api/cart', {
      debounce: 2000,  // Less frequent updates for cart
      headers: {
        'X-Session-ID': sessionId
      },
      onError: (error) => {
        // Store failed updates for retry
        const pendingUpdates = JSON.parse(
          localStorage.getItem('pending-cart-updates') || '[]'
        );
        pendingUpdates.push({
          timestamp: Date.now(),
          data: shoppingCart.get()
        });
        localStorage.setItem('pending-cart-updates', JSON.stringify(pendingUpdates));
      }
    })
  ]
);
```

### 4. Form Auto-save

```typescript
interface FormData {
  step: number;
  fields: Record<string, any>;
  completed: boolean;
}

const formState = pouch<FormData>(
  { step: 1, fields: {}, completed: false },
  [
    debounce(1000),  // Debounce user input first
    sync(`/api/forms/${formId}/draft`, {
      debounce: 0,  // No additional debounce after input debounce
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Draft': 'true'
      }
    }),
    persist('form-draft')  // Local backup
  ]
);
```

### 5. Analytics Data Collection

```typescript
interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

const analyticsQueue = pouch<AnalyticsEvent[]>(
  [],
  [
    sync('/api/analytics/events', {
      debounce: 5000,  // Batch events every 5 seconds
      method: 'POST',
      onError: (error) => {
        // Don't lose analytics data on error
        console.warn('Analytics sync failed, will retry', error);
      }
    }),
    middleware((events) => {
      // Clear queue after successful sync
      if (events.length > 100) {
        return events.slice(-100);  // Keep only last 100 events
      }
      return events;
    })
  ]
);
```

### 6. Optimistic Updates

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  synced: boolean;
}

const todos = pouch<TodoItem[]>(
  [],
  [
    middleware((items) => {
      // Mark new items as unsynced
      return items.map(item => ({
        ...item,
        synced: item.id ? item.synced : false
      }));
    }),
    sync('/api/todos', {
      debounce: 1000,
      onError: (error) => {
        // Revert optimistic updates on error
        todos.set(current => 
          current.map(item => 
            item.synced ? item : { ...item, error: true }
          )
        );
      }
    })
  ]
);
```

### 7. WebSocket Integration

```typescript
// Combine HTTP sync with WebSocket for real-time updates
const realtimeData = pouch(
  { messages: [], users: [], typing: [] },
  [
    sync('/api/chat/state', {
      debounce: 0,  // Immediate sync for chat
      method: 'GET'  // Only fetch, updates via WebSocket
    })
  ]
);

// WebSocket for real-time updates
const ws = new WebSocket('wss://api.example.com/chat');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  realtimeData.set(current => ({
    ...current,
    ...update
  }));
};
```

### 8. Conditional Sync

```typescript
const conditionalSync = pouch(
  { data: {}, syncEnabled: true },
  [
    sync('/api/data', {
      debounce: 1000,
      // Custom fetch wrapper for conditional sync
      fetch: async (url: string, options: RequestInit) => {
        const state = conditionalSync.get();
        if (!state.syncEnabled) {
          return new Response(JSON.stringify(state.data));
        }
        return fetch(url, options);
      }
    })
  ]
);
```

## Error Handling Strategies

### Retry Logic

```typescript
function syncWithRetry(url: string, maxRetries = 3) {
  let retries = 0;
  
  return sync(url, {
    onError: async (error) => {
      if (retries < maxRetries) {
        retries++;
        console.log(`Retry attempt ${retries}/${maxRetries}`);
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
        
        // Trigger manual sync
        // Note: This is a simplified example
      } else {
        console.error('Max retries reached', error);
      }
    }
  });
}
```

### Offline Queue

```typescript
const offlineQueue: any[] = [];

const syncWithOfflineSupport = sync('/api/data', {
  onError: (error) => {
    if (!navigator.onLine) {
      offlineQueue.push({
        timestamp: Date.now(),
        data: pouch.get()
      });
    }
  }
});

// Process queue when back online
window.addEventListener('online', async () => {
  for (const item of offlineQueue) {
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify(item.data),
      headers: { 'Content-Type': 'application/json' }
    });
  }
  offlineQueue.length = 0;
});
```

## Notes

- The sync plugin works in both browser and Node.js environments (when fetch is available)
- Initial data is fetched with GET request on setup
- Updates are sent with POST request by default (configurable via `method`)
- The plugin includes automatic JSON serialization and content-type headers
- Debouncing prevents excessive API calls during rapid state changes
- Failed syncs don't affect local state updates
- Consider implementing:
  - Conflict resolution for concurrent updates
  - Offline support with queue mechanism
  - Retry logic with exponential backoff
  - Optimistic updates with rollback on failure
- For bidirectional sync, consider WebSockets or polling
- CORS must be properly configured on the server
- Large payloads should be paginated or compressed