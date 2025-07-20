# Schema Plugin

The schema plugin validates the structure and types of your pouch state, ensuring data integrity by throwing errors when the state doesn't match the expected schema.

## Import

```typescript
import { schema } from 'react-pouch/plugins';
```

## Configuration

```typescript
interface SchemaDefinition {
  [key: string]: string | SchemaDefinition;
}

schema(schemaDefinition: SchemaDefinition)
```

The schema definition uses string type names for primitives ('string', 'number', 'boolean', 'array', 'object') and nested objects for complex structures.

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { schema } from 'react-pouch/plugins';

const userPouch = pouch(
  { name: 'John', age: 30, email: 'john@example.com' },
  [
    schema({
      name: 'string',
      age: 'number',
      email: 'string'
    })
  ]
);

// This works
userPouch.set({ name: 'Jane', age: 25, email: 'jane@example.com' });

// This throws an error: "Invalid type for age: expected number, got string"
userPouch.set({ name: 'Jane', age: '25', email: 'jane@example.com' });
```

### Nested Schema

```typescript
const profilePouch = pouch(
  {
    user: {
      id: '123',
      details: {
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      }
    },
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  [
    schema({
      user: {
        id: 'string',
        details: {
          firstName: 'string',
          lastName: 'string',
          age: 'number'
        }
      },
      settings: {
        theme: 'string',
        notifications: 'boolean'
      }
    })
  ]
);
```

### Array Validation

```typescript
const todosPouch = pouch(
  {
    items: ['Task 1', 'Task 2'],
    tags: ['work', 'personal'],
    completed: [false, false]
  },
  [
    schema({
      items: 'array',
      tags: 'array',
      completed: 'array'
    })
  ]
);
```

## API Methods

This plugin doesn't add any methods to the pouch instance. It validates on every state update and throws errors for schema violations.

## Common Use Cases

### 1. API Response Validation

```typescript
interface ApiResponse {
  data: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
    pagination: {
      page: number;
      total: number;
      perPage: number;
    };
  };
  status: string;
  timestamp: string;
}

const apiData = pouch<ApiResponse>(
  {
    data: { users: [], pagination: { page: 1, total: 0, perPage: 10 } },
    status: 'idle',
    timestamp: new Date().toISOString()
  },
  [
    schema({
      data: {
        users: 'array',
        pagination: {
          page: 'number',
          total: 'number',
          perPage: 'number'
        }
      },
      status: 'string',
      timestamp: 'string'
    })
  ]
);
```

### 2. Form Data Validation

```typescript
interface RegistrationForm {
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      zipCode: string;
    };
  };
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
  };
}

const registrationForm = pouch<RegistrationForm>(
  {
    personal: { firstName: '', lastName: '', dateOfBirth: '' },
    contact: { 
      email: '', 
      phone: '', 
      address: { street: '', city: '', zipCode: '' } 
    },
    preferences: { newsletter: false, smsNotifications: false }
  },
  [
    schema({
      personal: {
        firstName: 'string',
        lastName: 'string',
        dateOfBirth: 'string'
      },
      contact: {
        email: 'string',
        phone: 'string',
        address: {
          street: 'string',
          city: 'string',
          zipCode: 'string'
        }
      },
      preferences: {
        newsletter: 'boolean',
        smsNotifications: 'boolean'
      }
    })
  ]
);
```

### 3. Configuration Validation

```typescript
interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    darkMode: boolean;
    beta: boolean;
    analytics: boolean;
  };
  cache: {
    enabled: boolean;
    maxAge: number;
    maxSize: number;
  };
}

const configPouch = pouch<AppConfig>(
  {
    api: { baseUrl: 'https://api.example.com', timeout: 5000, retries: 3 },
    features: { darkMode: true, beta: false, analytics: true },
    cache: { enabled: true, maxAge: 3600, maxSize: 100 }
  },
  [
    schema({
      api: {
        baseUrl: 'string',
        timeout: 'number',
        retries: 'number'
      },
      features: {
        darkMode: 'boolean',
        beta: 'boolean',
        analytics: 'boolean'
      },
      cache: {
        enabled: 'boolean',
        maxAge: 'number',
        maxSize: 'number'
      }
    })
  ]
);
```

### 4. Game State Schema

```typescript
interface GameState {
  player: {
    name: string;
    level: number;
    health: number;
    inventory: string[];
  };
  world: {
    currentMap: string;
    position: {
      x: number;
      y: number;
    };
  };
  stats: {
    score: number;
    playtime: number;
    achievements: string[];
  };
}

const gameState = pouch<GameState>(
  {
    player: { name: 'Hero', level: 1, health: 100, inventory: [] },
    world: { currentMap: 'start', position: { x: 0, y: 0 } },
    stats: { score: 0, playtime: 0, achievements: [] }
  },
  [
    schema({
      player: {
        name: 'string',
        level: 'number',
        health: 'number',
        inventory: 'array'
      },
      world: {
        currentMap: 'string',
        position: {
          x: 'number',
          y: 'number'
        }
      },
      stats: {
        score: 'number',
        playtime: 'number',
        achievements: 'array'
      }
    })
  ]
);
```

### 5. E-commerce Cart Schema

```typescript
interface ShoppingCart {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shipping: {
    method: string;
    cost: number;
    estimatedDays: number;
  };
  payment: {
    method: string;
    processed: boolean;
  };
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

const cart = pouch<ShoppingCart>(
  {
    items: [],
    shipping: { method: 'standard', cost: 0, estimatedDays: 5 },
    payment: { method: '', processed: false },
    totals: { subtotal: 0, tax: 0, total: 0 }
  },
  [
    schema({
      items: 'array',
      shipping: {
        method: 'string',
        cost: 'number',
        estimatedDays: 'number'
      },
      payment: {
        method: 'string',
        processed: 'boolean'
      },
      totals: {
        subtotal: 'number',
        tax: 'number',
        total: 'number'
      }
    })
  ]
);
```

### 6. Combining with Other Plugins

```typescript
const validatedPouch = pouch(
  { name: '', age: 0, email: '' },
  [
    // First validate structure
    schema({
      name: 'string',
      age: 'number',
      email: 'string'
    }),
    // Then validate values
    validate((data) => ({
      isValid: data.age >= 0 && data.age <= 150,
      error: 'Age must be between 0 and 150'
    })),
    // Then persist valid data
    persist('user-data')
  ]
);
```

## Error Messages

The schema plugin provides descriptive error messages:

- `"Missing required field: user.email"`
- `"Invalid type for age: expected number, got string"`
- `"Invalid type for settings.notifications: expected boolean, got object"`

## Limitations and Considerations

### Current Limitations

1. **No optional fields** - All fields in the schema are required
2. **Basic type checking** - Only checks primitive types and array/object
3. **No array item validation** - Can't specify types for array elements
4. **No union types** - Can't specify multiple valid types

### Workarounds

For more complex validation needs, combine with the `validate` plugin:

```typescript
const complexPouch = pouch(
  { status: 'active', data: null },
  [
    // Basic structure validation
    schema({
      status: 'string',
      data: 'object'  // Could be object or null
    }),
    // Advanced validation
    validate((state) => {
      // Check if status is valid enum
      const validStatuses = ['active', 'inactive', 'pending'];
      if (!validStatuses.includes(state.status)) {
        return {
          isValid: false,
          error: `Status must be one of: ${validStatuses.join(', ')}`
        };
      }
      
      // Allow null for data
      if (state.data === null) {
        return { isValid: true };
      }
      
      return { isValid: true };
    })
  ]
);
```

## Notes

- Schema validation happens synchronously on every state update
- Validation errors are thrown, not logged - handle them appropriately
- The plugin checks both type and presence of fields
- Nested objects are validated recursively
- Arrays are only checked for being arrays, not their contents
- Use this plugin for runtime type safety in addition to TypeScript
- Place schema plugin early in the plugin chain for fail-fast behavior
- Consider performance impact for deeply nested schemas
- For production, combine with error boundaries to handle validation errors gracefully