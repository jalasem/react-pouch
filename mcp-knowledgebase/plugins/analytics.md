# Analytics Plugin

The analytics plugin enables automatic tracking of state changes to Google Analytics (gtag), helping you understand how users interact with your application state.

## Import

```typescript
import { analytics } from 'react-pouch/plugins';
```

## Configuration Options

```typescript
interface AnalyticsOptions {
  trackInitial?: boolean;      // Track initial state on pouch creation (default: false)
  includeTimestamp?: boolean;   // Include timestamp with events (default: true)
  sanitize?: (value: any) => any; // Function to sanitize sensitive data (default: identity function)
}
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { analytics } from 'react-pouch/plugins';

const userPreferences = pouch({ theme: 'light', language: 'en' }, [
  analytics('user_preferences_changed')
]);

// Every state change will be tracked to Google Analytics
userPreferences.set({ theme: 'dark', language: 'en' });
```

### With Options

```typescript
const cartPouch = pouch({ items: [], total: 0 }, [
  analytics('shopping_cart_updated', {
    trackInitial: true,  // Track cart initialization
    includeTimestamp: true,
    sanitize: (value) => ({
      ...value,
      // Remove sensitive customer data
      customerEmail: undefined,
      creditCard: undefined
    })
  })
]);
```

### Sanitizing Sensitive Data

```typescript
const userPouch = pouch(
  { 
    id: '123', 
    email: 'user@example.com', 
    password: 'secret',
    preferences: { notifications: true }
  },
  [
    analytics('user_data_changed', {
      sanitize: (value) => ({
        id: value.id,
        preferences: value.preferences
        // Exclude email and password from analytics
      })
    })
  ]
);
```

## API Methods

This plugin does not add any methods to the pouch instance. It works by intercepting state changes and sending them to Google Analytics.

## Common Use Cases

### 1. Feature Usage Tracking

Track which features users interact with most:

```typescript
const featureToggle = pouch({ darkMode: false, betaFeatures: false }, [
  analytics('feature_toggled', { trackInitial: true })
]);
```

### 2. E-commerce Analytics

Track shopping behavior:

```typescript
const checkoutPouch = pouch(
  { 
    step: 'cart',
    items: [],
    shippingMethod: null,
    paymentMethod: null
  },
  [
    analytics('checkout_progress', {
      sanitize: (value) => ({
        step: value.step,
        itemCount: value.items.length,
        hasShipping: !!value.shippingMethod,
        hasPayment: !!value.paymentMethod
      })
    })
  ]
);
```

### 3. User Preference Changes

Monitor how users customize their experience:

```typescript
const settingsPouch = pouch(
  {
    theme: 'auto',
    fontSize: 'medium',
    notifications: true,
    language: 'en'
  },
  [
    analytics('settings_changed', {
      trackInitial: true,
      includeTimestamp: true
    })
  ]
);
```

### 4. Form Abandonment Tracking

Track form progress to identify abandonment points:

```typescript
const formPouch = pouch(
  {
    currentStep: 1,
    completed: false,
    data: {}
  },
  [
    analytics('form_progress', {
      sanitize: (value) => ({
        currentStep: value.currentStep,
        completed: value.completed,
        // Don't send actual form data
      })
    })
  ]
);
```

## Notes

- The plugin only works in browser environments where `window.gtag` is available
- Make sure Google Analytics (gtag.js) is properly initialized in your application
- Events are sent with the following structure:
  - Event name: The string you provide
  - Event parameters:
    - `previous_value`: JSON stringified previous state
    - `new_value`: JSON stringified new state
    - `timestamp`: ISO string timestamp (if enabled)
- Use the `sanitize` option to remove sensitive data before sending to analytics
- For initial state tracking, an event with suffix `_initialized` is sent