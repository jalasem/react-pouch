# Middleware Plugin

The middleware plugin allows you to transform values before they are set in the pouch. You can chain multiple middleware functions to create a pipeline of transformations, validations, or side effects.

## Import

```typescript
import { middleware } from 'react-pouch/plugins';
```

## Configuration

```typescript
type Middleware<T> = (value: T, oldValue: T) => T;

middleware<T>(...middlewares: Middleware<T>[])
```

The plugin accepts one or more middleware functions that receive the new value and old value, and must return the transformed value.

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { middleware } from 'react-pouch/plugins';

const numberPouch = pouch(0, [
  middleware(
    (value) => Math.max(0, value),        // Ensure non-negative
    (value) => Math.min(100, value),      // Cap at 100
    (value) => Math.round(value)          // Round to integer
  )
]);

numberPouch.set(150);   // Results in 100
numberPouch.set(-10);   // Results in 0
numberPouch.set(45.7);  // Results in 46
```

### With Complex Transformations

```typescript
interface User {
  name: string;
  email: string;
  role: string;
  lastModified?: Date;
}

const userPouch = pouch<User>(
  { name: '', email: '', role: 'user' },
  [
    middleware(
      // Trim whitespace
      (user) => ({
        ...user,
        name: user.name.trim(),
        email: user.email.trim().toLowerCase()
      }),
      // Add timestamp
      (user) => ({
        ...user,
        lastModified: new Date()
      }),
      // Validate role
      (user, oldUser) => ({
        ...user,
        role: ['admin', 'user', 'guest'].includes(user.role) 
          ? user.role 
          : oldUser.role
      })
    )
  ]
);
```

## API Methods

This plugin modifies the behavior of the `set` method but doesn't add any new methods to the pouch instance.

## Common Use Cases

### 1. Data Normalization

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tags: string[];
}

const productPouch = pouch<Product>(
  { id: '', name: '', price: 0, category: '', tags: [] },
  [
    middleware(
      // Normalize strings
      (product) => ({
        ...product,
        name: product.name.trim(),
        category: product.category.toLowerCase().replace(/\s+/g, '-'),
        tags: product.tags.map(tag => tag.toLowerCase().trim())
      }),
      // Ensure price constraints
      (product) => ({
        ...product,
        price: Math.max(0, Math.round(product.price * 100) / 100)
      }),
      // Generate ID if missing
      (product) => ({
        ...product,
        id: product.id || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
    )
  ]
);
```

### 2. Audit Trail

```typescript
interface AuditableState {
  data: any;
  history: Array<{
    timestamp: Date;
    change: string;
    oldValue: any;
    newValue: any;
  }>;
}

const auditPouch = pouch<AuditableState>(
  { data: {}, history: [] },
  [
    middleware((state, oldState) => {
      const changes = JSON.stringify(state.data) !== JSON.stringify(oldState.data);
      
      if (changes) {
        return {
          ...state,
          history: [
            ...state.history,
            {
              timestamp: new Date(),
              change: 'data_modified',
              oldValue: oldState.data,
              newValue: state.data
            }
          ].slice(-50) // Keep last 50 entries
        };
      }
      
      return state;
    })
  ]
);
```

### 3. Computed Properties

```typescript
interface ShoppingCart {
  items: Array<{ id: string; price: number; quantity: number }>;
  discount: number;
  // Computed
  subtotal?: number;
  tax?: number;
  total?: number;
}

const cartPouch = pouch<ShoppingCart>(
  { items: [], discount: 0 },
  [
    middleware((cart) => {
      const subtotal = cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const discountAmount = subtotal * (cart.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const tax = taxableAmount * 0.08; // 8% tax
      
      return {
        ...cart,
        subtotal,
        tax,
        total: taxableAmount + tax
      };
    })
  ]
);
```

### 4. Access Control

```typescript
interface SecureData {
  publicData: any;
  privateData: any;
  userRole: 'admin' | 'user' | 'guest';
}

const securePouch = pouch<SecureData>(
  { publicData: {}, privateData: {}, userRole: 'guest' },
  [
    middleware((data, oldData) => {
      // Prevent non-admins from modifying private data
      if (data.userRole !== 'admin' && 
          JSON.stringify(data.privateData) !== JSON.stringify(oldData.privateData)) {
        console.warn('Unauthorized attempt to modify private data');
        return {
          ...data,
          privateData: oldData.privateData
        };
      }
      return data;
    })
  ]
);
```

### 5. Immutability Helper

```typescript
interface NestedState {
  user: {
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  };
}

const deepPouch = pouch<NestedState>(
  { user: { profile: { name: '', settings: { theme: 'light', notifications: true } } } },
  [
    middleware((state) => {
      // Ensure immutability by deep cloning
      return JSON.parse(JSON.stringify(state));
    })
  ]
);
```

### 6. Validation Pipeline

```typescript
interface FormData {
  username: string;
  email: string;
  age: number;
  acceptedTerms: boolean;
}

const formPouch = pouch<FormData>(
  { username: '', email: '', age: 0, acceptedTerms: false },
  [
    middleware(
      // Sanitize inputs
      (data) => ({
        ...data,
        username: data.username.replace(/[^a-zA-Z0-9_]/g, ''),
        email: data.email.trim().toLowerCase()
      }),
      // Validate age
      (data) => ({
        ...data,
        age: Math.max(0, Math.min(150, Math.floor(data.age)))
      }),
      // Check required fields
      (data, oldData) => {
        if (!data.acceptedTerms && data.username && data.email) {
          console.warn('Terms must be accepted');
          return oldData;
        }
        return data;
      }
    )
  ]
);
```

### 7. Rate Limiting

```typescript
interface RateLimitedState {
  value: any;
  lastUpdate: number;
  updateCount: number;
}

const rateLimitedPouch = pouch<RateLimitedState>(
  { value: null, lastUpdate: 0, updateCount: 0 },
  [
    middleware((state, oldState) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - state.lastUpdate;
      
      // Reset counter every minute
      if (timeSinceLastUpdate > 60000) {
        return {
          ...state,
          lastUpdate: now,
          updateCount: 1
        };
      }
      
      // Limit to 10 updates per minute
      if (state.updateCount >= 10) {
        console.warn('Rate limit exceeded');
        return oldState;
      }
      
      return {
        ...state,
        lastUpdate: now,
        updateCount: state.updateCount + 1
      };
    })
  ]
);
```

### 8. Combining with Other Plugins

```typescript
const apiDataPouch = pouch(
  { data: null, loading: false, error: null },
  [
    // Transform data before validation
    middleware((state) => ({
      ...state,
      data: state.data ? { ...state.data, processed: true } : null
    })),
    // Then validate
    validate((state) => ({
      isValid: !state.loading || !state.error,
      error: 'Cannot be loading and have error simultaneously'
    })),
    // Then persist
    persist('api-data')
  ]
);
```

## Notes

- Middleware functions are executed in the order they are provided
- Each middleware receives the result of the previous middleware
- Middleware functions must be pure and return a value
- Both new value and old value are provided for comparison
- Middleware runs before other plugin transformations
- Use middleware for:
  - Data transformation and normalization
  - Adding computed properties
  - Implementing business logic
  - Access control and permissions
  - Audit logging
- Avoid side effects in middleware - use the `analytics` or `logger` plugins for that
- Middleware can prevent updates by returning the old value
- Function updates are resolved before being passed to middleware