# Common Use Cases for React Pouch

## 1. Theme Management

```typescript
import { pouch } from 'react-pouch';
import { persist } from 'react-pouch/plugins';

type Theme = 'light' | 'dark' | 'auto';

const theme = pouch<Theme>('light', [persist('app-theme')]);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = theme.use();
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);
  
  return <div className={`theme-${currentTheme}`}>{children}</div>;
}

function ThemeToggle() {
  const currentTheme = theme.use();
  
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    theme.set(themes[nextIndex]);
  };
  
  return (
    <button onClick={cycleTheme}>
      {currentTheme === 'light' ? '☀️' : currentTheme === 'dark' ? '🌙' : '🔄'}
    </button>
  );
}
```

## 2. Shopping Cart

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const cart = pouch<CartItem[]>([], [
  persist('shopping-cart'),
  computed(() => {
    const items = cart.get();
    return {
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  })
]);

function useCart() {
  const items = cart.use();
  
  const addItem = (product: Omit<CartItem, 'quantity'>) => {
    cart.set(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const removeItem = (id: string) => {
    cart.set(prev => prev.filter(item => item.id !== id));
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    cart.set(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => cart.set([]);
  
  return { items, addItem, removeItem, updateQuantity, clearCart };
}

function CartSummary() {
  const { items } = useCart();
  const summary = cart.computed.use(); // Access computed values
  
  return (
    <div>
      <span>Items: {summary.itemCount}</span>
      <span>Total: ${summary.total.toFixed(2)}</span>
    </div>
  );
}
```

## 3. User Authentication

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const user = pouch<User | null>(null, [
  persist('current-user'),
  middleware(async (newUser, oldUser) => {
    if (newUser && !oldUser) {
      // User logged in - initialize app data
      await initializeUserData(newUser.id);
    } else if (!newUser && oldUser) {
      // User logged out - cleanup
      await cleanupUserData();
    }
    return newUser;
  })
]);

function useAuth() {
  const currentUser = user.use();
  
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const userData = await api.login(credentials);
      user.set(userData);
    } catch (error) {
      throw new Error('Login failed');
    }
  };
  
  const logout = async () => {
    await api.logout();
    user.set(null);
  };
  
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';
  
  return { currentUser, login, logout, isAuthenticated, isAdmin };
}

function ProtectedRoute({ children, requireAdmin = false }: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { currentUser, isAdmin } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <div>Access denied</div>;
  }
  
  return <>{children}</>;
}
```

## 4. Form State with Validation

```typescript
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const contactForm = pouch<ContactForm>({
  name: '',
  email: '',
  message: ''
}, [
  validate((form) => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push('Name is required');
    if (!form.email.includes('@')) errors.push('Valid email is required');
    if (form.message.length < 10) errors.push('Message must be at least 10 characters');
    if (errors.length > 0) throw new Error(errors.join(', '));
    return form;
  }),
  debounce(300) // Debounce validation
]);

const formErrors = pouch<string>('');

contactForm.subscribe(() => {
  formErrors.set(''); // Clear errors on successful validation
}, (error) => {
  formErrors.set(error.message); // Set errors on validation failure
});

function ContactForm() {
  const form = contactForm.use();
  const errors = formErrors.use();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateField = (field: keyof ContactForm, value: string) => {
    contactForm.set(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await api.submitContact(form);
      contactForm.set({ name: '', email: '', message: '' });
      alert('Message sent successfully!');
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {errors && <div className="error">{errors}</div>}
      
      <input
        value={form.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="Name"
        required
      />
      
      <input
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        placeholder="Email"
        required
      />
      
      <textarea
        value={form.message}
        onChange={(e) => updateField('message', e.target.value)}
        placeholder="Message"
        required
      />
      
      <button type="submit" disabled={isSubmitting || !!errors}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

## 5. Real-time Notifications

```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const notifications = pouch<Notification[]>([], [
  persist('notifications'),
  middleware((newNotifications) => {
    // Auto-remove notifications after 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return newNotifications.filter(n => n.timestamp > fiveMinutesAgo);
  })
]);

function useNotifications() {
  const items = notifications.use();
  
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };
    
    notifications.set(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds for success notifications
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };
  
  const removeNotification = (id: string) => {
    notifications.set(prev => prev.filter(n => n.id !== id));
  };
  
  const markAsRead = (id: string) => {
    notifications.set(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const clearAll = () => notifications.set([]);
  
  const unreadCount = items.filter(n => !n.read).length;
  
  return {
    items,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll
  };
}

function NotificationCenter() {
  const { items, unreadCount, removeNotification, markAsRead } = useNotifications();
  
  if (items.length === 0) return null;
  
  return (
    <div className="notification-center">
      <h3>Notifications {unreadCount > 0 && <span>({unreadCount})</span>}</h3>
      {items.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type} ${notification.read ? 'read' : 'unread'}`}
          onClick={() => !notification.read && markAsRead(notification.id)}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Usage in other components
function OrderSuccess() {
  const { addNotification } = useNotifications();
  
  const handleOrderComplete = () => {
    addNotification({
      type: 'success',
      title: 'Order Placed',
      message: 'Your order has been successfully placed!'
    });
  };
  
  return <button onClick={handleOrderComplete}>Place Order</button>;
}
```

## 6. Settings Management

```typescript
interface AppSettings {
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
}

const defaultSettings: AppSettings = {
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    showProfile: true,
    showActivity: false
  },
  appearance: {
    theme: 'auto',
    fontSize: 'medium'
  }
};

const settings = pouch(defaultSettings, [
  persist('app-settings'),
  validate((settings) => {
    const validLanguages = ['en', 'es', 'fr', 'de'];
    if (!validLanguages.includes(settings.language)) {
      throw new Error('Invalid language');
    }
    return settings;
  }),
  sync('/api/settings', { debounce: 1000 }) // Auto-sync to server
]);

function useSettings() {
  const currentSettings = settings.use();
  
  const updateSetting = <T extends keyof AppSettings>(
    category: T,
    updates: Partial<AppSettings[T]>
  ) => {
    settings.set(prev => ({
      ...prev,
      [category]: { ...prev[category], ...updates }
    }));
  };
  
  const resetToDefaults = () => {
    settings.set(defaultSettings);
  };
  
  return { settings: currentSettings, updateSetting, resetToDefaults };
}

function SettingsPanel() {
  const { settings: userSettings, updateSetting } = useSettings();
  
  return (
    <div className="settings-panel">
      <section>
        <h3>Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={userSettings.notifications.email}
            onChange={(e) => updateSetting('notifications', { email: e.target.checked })}
          />
          Email Notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={userSettings.notifications.push}
            onChange={(e) => updateSetting('notifications', { push: e.target.checked })}
          />
          Push Notifications
        </label>
      </section>
      
      <section>
        <h3>Appearance</h3>
        <select
          value={userSettings.appearance.theme}
          onChange={(e) => updateSetting('appearance', { theme: e.target.value as any })}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </section>
    </div>
  );
}
```

## 7. Search with Filters

```typescript
interface SearchState {
  query: string;
  filters: {
    category: string;
    priceRange: [number, number];
    inStock: boolean;
  };
  sortBy: 'name' | 'price' | 'rating';
  sortOrder: 'asc' | 'desc';
}

const searchState = pouch<SearchState>({
  query: '',
  filters: {
    category: 'all',
    priceRange: [0, 1000],
    inStock: false
  },
  sortBy: 'name',
  sortOrder: 'asc'
}, [debounce(300)]);

const searchResults = pouch<Product[]>([]);

// Auto-search when state changes
searchState.subscribe(async (state) => {
  if (state.query.length > 2) {
    const results = await api.search(state);
    searchResults.set(results);
  } else {
    searchResults.set([]);
  }
});

function useSearch() {
  const state = searchState.use();
  const results = searchResults.use();
  
  const setQuery = (query: string) => {
    searchState.set(prev => ({ ...prev, query }));
  };
  
  const setFilter = <K extends keyof SearchState['filters']>(
    key: K,
    value: SearchState['filters'][K]
  ) => {
    searchState.set(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };
  
  const setSort = (sortBy: SearchState['sortBy'], sortOrder: SearchState['sortOrder']) => {
    searchState.set(prev => ({ ...prev, sortBy, sortOrder }));
  };
  
  const clearFilters = () => {
    searchState.set(prev => ({
      ...prev,
      filters: {
        category: 'all',
        priceRange: [0, 1000],
        inStock: false
      }
    }));
  };
  
  return { state, results, setQuery, setFilter, setSort, clearFilters };
}

function SearchPage() {
  const { state, results, setQuery, setFilter, setSort } = useSearch();
  
  return (
    <div className="search-page">
      <div className="search-bar">
        <input
          value={state.query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
        />
      </div>
      
      <div className="filters">
        <select
          value={state.filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={state.filters.inStock}
            onChange={(e) => setFilter('inStock', e.target.checked)}
          />
          In Stock Only
        </label>
      </div>
      
      <div className="sort">
        <select
          value={`${state.sortBy}-${state.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            setSort(sortBy as any, sortOrder as any);
          }}
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price Low-High</option>
          <option value="price-desc">Price High-Low</option>
        </select>
      </div>
      
      <div className="results">
        {results.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

## 8. Multi-step Wizard

```typescript
interface WizardStep {
  id: string;
  title: string;
  isValid: boolean;
  data: any;
}

interface WizardState {
  steps: WizardStep[];
  currentStepIndex: number;
  isCompleted: boolean;
}

const wizard = pouch<WizardState>({
  steps: [
    { id: 'personal', title: 'Personal Info', isValid: false, data: {} },
    { id: 'address', title: 'Address', isValid: false, data: {} },
    { id: 'payment', title: 'Payment', isValid: false, data: {} },
    { id: 'review', title: 'Review', isValid: false, data: {} }
  ],
  currentStepIndex: 0,
  isCompleted: false
}, [persist('wizard-progress')]);

function useWizard() {
  const state = wizard.use();
  
  const currentStep = state.steps[state.currentStepIndex];
  const canGoNext = currentStep?.isValid && state.currentStepIndex < state.steps.length - 1;
  const canGoPrevious = state.currentStepIndex > 0;
  
  const updateStepData = (stepId: string, data: any, isValid: boolean = true) => {
    wizard.set(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, data, isValid } : step
      )
    }));
  };
  
  const goToStep = (index: number) => {
    wizard.set(prev => ({ ...prev, currentStepIndex: index }));
  };
  
  const nextStep = () => {
    if (canGoNext) {
      goToStep(state.currentStepIndex + 1);
    }
  };
  
  const previousStep = () => {
    if (canGoPrevious) {
      goToStep(state.currentStepIndex - 1);
    }
  };
  
  const complete = () => {
    wizard.set(prev => ({ ...prev, isCompleted: true }));
  };
  
  const reset = () => {
    wizard.set({
      steps: state.steps.map(step => ({ ...step, data: {}, isValid: false })),
      currentStepIndex: 0,
      isCompleted: false
    });
  };
  
  return {
    state,
    currentStep,
    canGoNext,
    canGoPrevious,
    updateStepData,
    goToStep,
    nextStep,
    previousStep,
    complete,
    reset
  };
}

function WizardComponent() {
  const { state, currentStep, canGoNext, canGoPrevious, nextStep, previousStep } = useWizard();
  
  return (
    <div className="wizard">
      <div className="wizard-header">
        <div className="steps">
          {state.steps.map((step, index) => (
            <div
              key={step.id}
              className={`step ${index === state.currentStepIndex ? 'active' : ''} ${step.isValid ? 'valid' : ''}`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>
      
      <div className="wizard-content">
        {currentStep && <StepComponent step={currentStep} />}
      </div>
      
      <div className="wizard-footer">
        <button onClick={previousStep} disabled={!canGoPrevious}>
          Previous
        </button>
        <button onClick={nextStep} disabled={!canGoNext}>
          {state.currentStepIndex === state.steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```