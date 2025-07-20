# Computed Plugin

The computed plugin allows you to derive values from your pouch state, automatically updating whenever the source state changes. This is useful for calculated properties, formatted values, or any derived state.

## Import

```typescript
import { computed } from 'react-pouch/plugins';
```

## Configuration

The computed plugin takes a single function that receives the current state and returns the computed value:

```typescript
computed<T, C>(computeFn: (value: T) => C)
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { computed } from 'react-pouch/plugins';

const cartPouch = pouch(
  { items: [{ price: 10 }, { price: 20 }], tax: 0.08 },
  [
    computed((state) => {
      const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);
      return subtotal + (subtotal * state.tax);
    })
  ]
);

console.log(cartPouch.computed()); // 32.4
```

### Multiple Computed Values

```typescript
interface UserStats {
  posts: number;
  followers: number;
  following: number;
}

const userStats = pouch<UserStats>(
  { posts: 150, followers: 1000, following: 500 },
  [
    computed((stats) => ({
      engagementRate: (stats.posts / stats.followers) * 100,
      followerRatio: stats.followers / stats.following,
      totalInteractions: stats.posts + stats.followers + stats.following
    }))
  ]
);

const metrics = userStats.computed();
// { engagementRate: 15, followerRatio: 2, totalInteractions: 1650 }
```

### String Formatting

```typescript
const userPouch = pouch(
  { firstName: 'John', lastName: 'Doe', age: 30 },
  [
    computed((user) => `${user.firstName} ${user.lastName} (${user.age})`)
  ]
);

console.log(userPouch.computed()); // "John Doe (30)"
```

## API Methods

### `computed(): C`

Returns the current computed value. The value is automatically recalculated whenever the source state changes.

```typescript
const pouch = pouch(initialState, [computed(computeFn)]);
const computedValue = pouch.computed();
```

## Common Use Cases

### 1. Shopping Cart Calculations

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  discountPercent: number;
  shippingCost: number;
}

const cart = pouch<CartState>(
  { items: [], discountPercent: 0, shippingCost: 5.99 },
  [
    computed((state) => {
      const subtotal = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const discount = subtotal * (state.discountPercent / 100);
      const total = subtotal - discount + state.shippingCost;
      
      return {
        subtotal,
        discount,
        total,
        itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
        isEmpty: state.items.length === 0
      };
    })
  ]
);
```

### 2. Form Validation State

```typescript
interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const formPouch = pouch<FormData>(
  { username: '', email: '', password: '', confirmPassword: '' },
  [
    computed((data) => ({
      isUsernameValid: data.username.length >= 3,
      isEmailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
      isPasswordValid: data.password.length >= 8,
      passwordsMatch: data.password === data.confirmPassword,
      isFormValid: function() {
        return this.isUsernameValid && 
               this.isEmailValid && 
               this.isPasswordValid && 
               this.passwordsMatch;
      }
    }))
  ]
);
```

### 3. Data Filtering and Searching

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  tags: string[];
}

interface TodoState {
  items: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  searchTerm: string;
}

const todosPouch = pouch<TodoState>(
  { items: [], filter: 'all', searchTerm: '' },
  [
    computed((state) => {
      let filtered = state.items;
      
      // Apply filter
      if (state.filter !== 'all') {
        filtered = filtered.filter(item => 
          state.filter === 'completed' ? item.completed : !item.completed
        );
      }
      
      // Apply search
      if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          item.text.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }
      
      return {
        visibleTodos: filtered,
        activeCount: state.items.filter(item => !item.completed).length,
        completedCount: state.items.filter(item => item.completed).length
      };
    })
  ]
);
```

### 4. Display Formatting

```typescript
interface PriceData {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  locale: string;
}

const pricePouch = pouch<PriceData>(
  { amount: 1234.56, currency: 'USD', locale: 'en-US' },
  [
    computed((data) => {
      const formatter = new Intl.NumberFormat(data.locale, {
        style: 'currency',
        currency: data.currency
      });
      return formatter.format(data.amount);
    })
  ]
);

console.log(pricePouch.computed()); // "$1,234.56"
```

### 5. Aggregated Statistics

```typescript
interface SalesData {
  transactions: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
  dateRange: { start: string; end: string };
}

const salesPouch = pouch<SalesData>(
  { transactions: [], dateRange: { start: '2024-01-01', end: '2024-12-31' } },
  [
    computed((data) => {
      const filtered = data.transactions.filter(t => 
        t.date >= data.dateRange.start && t.date <= data.dateRange.end
      );
      
      const byCategory = filtered.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total: filtered.reduce((sum, t) => sum + t.amount, 0),
        count: filtered.length,
        average: filtered.length > 0 
          ? filtered.reduce((sum, t) => sum + t.amount, 0) / filtered.length 
          : 0,
        byCategory,
        topCategory: Object.entries(byCategory)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null
      };
    })
  ]
);
```

## Notes

- Computed values are recalculated synchronously whenever the source state changes
- The computed value is cached and only recalculated when the source state actually changes
- Computed functions should be pure and not have side effects
- For expensive computations, consider combining with the `debounce` or `throttle` plugins
- The computed plugin adds a `computed()` method to the pouch instance
- Type inference works automatically - TypeScript knows the return type of your compute function