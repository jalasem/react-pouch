# Debounce Plugin

The debounce plugin delays state updates until a specified time has passed without any new updates. This is particularly useful for reducing the frequency of expensive operations like API calls or complex computations.

## Import

```typescript
import { debounce } from 'react-pouch/plugins';
```

## Configuration

The debounce plugin accepts a single parameter:

```typescript
debounce(ms: number)  // Delay in milliseconds
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { debounce } from 'react-pouch/plugins';

const searchPouch = pouch('', [
  debounce(300)  // Wait 300ms after last change
]);

// These rapid changes will only result in one update after 300ms
searchPouch.set('h');
searchPouch.set('he');
searchPouch.set('hel');
searchPouch.set('hell');
searchPouch.set('hello');
// Only 'hello' will be applied after 300ms of inactivity
```

### With API Calls

```typescript
import { pouch } from 'react-pouch';
import { debounce, sync } from 'react-pouch/plugins';

const searchQuery = pouch('', [
  debounce(500),  // Wait 500ms before updating
  sync('/api/search')  // Then sync with API
]);

// User types quickly
searchQuery.set('react');
searchQuery.set('react ');
searchQuery.set('react p');
searchQuery.set('react po');
searchQuery.set('react pouch');
// Only 'react pouch' will be sent to the API after 500ms
```

### Form Auto-save

```typescript
const formData = pouch(
  { title: '', content: '', tags: [] },
  [
    debounce(1000),  // Auto-save after 1 second of inactivity
    persist('draft-form')
  ]
);

// Changes are batched and saved after 1 second
formData.set(current => ({ ...current, title: 'My Article' }));
formData.set(current => ({ ...current, content: 'This is the content...' }));
```

## API Methods

This plugin modifies the behavior of the `set` method but doesn't add any new methods to the pouch instance.

## Common Use Cases

### 1. Search Input Handling

Prevent excessive API calls while user is typing:

```typescript
const useSearch = () => {
  const [results, setResults] = useState([]);
  
  const searchTerm = pouch('', [
    debounce(400)
  ]);
  
  useEffect(() => {
    const unsubscribe = searchTerm.subscribe(async (term) => {
      if (term) {
        const data = await fetch(`/api/search?q=${term}`).then(r => r.json());
        setResults(data);
      } else {
        setResults([]);
      }
    });
    
    return unsubscribe;
  }, []);
  
  return { searchTerm, results };
};
```

### 2. Form Validation

Delay validation until user stops typing:

```typescript
const emailInput = pouch('', [
  debounce(500),
  validate((email) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
      isValid,
      error: isValid ? undefined : 'Invalid email format'
    };
  })
]);

// Validation only runs 500ms after user stops typing
```

### 3. Auto-saving Documents

Save changes after user pauses editing:

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  lastSaved?: Date;
}

const documentPouch = pouch<Document>(
  { id: '123', title: '', content: '' },
  [
    debounce(2000),  // Wait 2 seconds after last edit
    middleware((doc) => ({
      ...doc,
      lastSaved: new Date()
    })),
    sync('/api/documents/123', {
      method: 'PUT',
      onError: (error) => console.error('Auto-save failed:', error)
    })
  ]
);
```

### 4. Real-time Filters

Update filters after user stops interacting:

```typescript
interface FilterState {
  priceRange: [number, number];
  categories: string[];
  sortBy: string;
}

const filterPouch = pouch<FilterState>(
  { priceRange: [0, 1000], categories: [], sortBy: 'relevance' },
  [
    debounce(300),  // Wait for user to finish adjusting
    computed((filters) => {
      // Calculate filtered products
      return products.filter(p => 
        p.price >= filters.priceRange[0] &&
        p.price <= filters.priceRange[1] &&
        (filters.categories.length === 0 || 
         filters.categories.includes(p.category))
      );
    })
  ]
);
```

### 5. Window Resize Handler

Debounce expensive layout calculations:

```typescript
const windowSize = pouch(
  { width: window.innerWidth, height: window.innerHeight },
  [
    debounce(200)  // Update after resize stops
  ]
);

window.addEventListener('resize', () => {
  windowSize.set({
    width: window.innerWidth,
    height: window.innerHeight
  });
});
```

### 6. Combined with Other Plugins

Debounce works well with other plugins:

```typescript
const analyticsPouch = pouch(
  { event: '', properties: {} },
  [
    debounce(1000),  // Batch events
    analytics('user_interaction', {
      sanitize: (data) => ({
        event: data.event,
        // Remove sensitive properties
      })
    })
  ]
);

// Multiple rapid events will be batched
analyticsPouch.set({ event: 'click', properties: { button: 'save' } });
analyticsPouch.set({ event: 'hover', properties: { element: 'menu' } });
```

## Notes

- Debounce delays all state updates, not just the final value
- Each new `set` call cancels the previous pending update
- The delay timer starts after the last `set` call
- Function updates are supported and will be called with the current state when the timer expires
- Debounce is useful for:
  - Reducing API call frequency
  - Batching rapid state changes
  - Preventing UI flicker during rapid updates
  - Optimizing expensive computations
- Consider using `throttle` instead if you need regular updates at a maximum frequency
- The debounced `set` method maintains the same signature as the original