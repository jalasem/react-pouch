# Validate Plugin

The validate plugin provides custom validation logic for pouch state updates. It runs validator functions before applying state changes and throws errors when validation fails, ensuring data integrity.

## Import

```typescript
import { validate } from 'react-pouch/plugins';
```

## Configuration

```typescript
type Validator<T> = (value: T) => { isValid: boolean; error?: string };

validate<T>(validator: Validator<T>)
```

The validator function receives the new state value and must return an object with `isValid` boolean and optional `error` message.

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { validate } from 'react-pouch/plugins';

const agePouch = pouch(0, [
  validate((age) => ({
    isValid: age >= 0 && age <= 150,
    error: 'Age must be between 0 and 150'
  }))
]);

agePouch.set(25);   // Works
agePouch.set(-5);   // Throws: "Age must be between 0 and 150"
agePouch.set(200);  // Throws: "Age must be between 0 and 150"
```

### Complex Validation

```typescript
interface User {
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
}

const userPouch = pouch<User>(
  { name: '', email: '', age: 0, role: 'guest' },
  [
    validate((user) => {
      // Name validation
      if (!user.name || user.name.trim().length < 2) {
        return {
          isValid: false,
          error: 'Name must be at least 2 characters long'
        };
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        return {
          isValid: false,
          error: 'Please enter a valid email address'
        };
      }
      
      // Age validation
      if (user.age < 13 || user.age > 120) {
        return {
          isValid: false,
          error: 'Age must be between 13 and 120'
        };
      }
      
      // Role validation
      const validRoles = ['admin', 'user', 'guest'];
      if (!validRoles.includes(user.role)) {
        return {
          isValid: false,
          error: 'Invalid role specified'
        };
      }
      
      return { isValid: true };
    })
  ]
);
```

### Multiple Validators

```typescript
const passwordPouch = pouch('', [
  validate((password) => ({
    isValid: password.length >= 8,
    error: 'Password must be at least 8 characters long'
  })),
  validate((password) => ({
    isValid: /[A-Z]/.test(password),
    error: 'Password must contain at least one uppercase letter'
  })),
  validate((password) => ({
    isValid: /[a-z]/.test(password),
    error: 'Password must contain at least one lowercase letter'
  })),
  validate((password) => ({
    isValid: /\d/.test(password),
    error: 'Password must contain at least one number'
  })),
  validate((password) => ({
    isValid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    error: 'Password must contain at least one special character'
  }))
]);
```

## API Methods

This plugin modifies the behavior of the `set` method but doesn't add any new methods to the pouch instance.

## Common Use Cases

### 1. Form Validation

```typescript
interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const registrationForm = pouch<RegistrationForm>(
  { username: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  [
    validate((form) => {
      if (form.username.length < 3) {
        return {
          isValid: false,
          error: 'Username must be at least 3 characters long'
        };
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        return {
          isValid: false,
          error: 'Username can only contain letters, numbers, and underscores'
        };
      }
      
      if (form.password !== form.confirmPassword) {
        return {
          isValid: false,
          error: 'Passwords do not match'
        };
      }
      
      if (!form.acceptTerms) {
        return {
          isValid: false,
          error: 'You must accept the terms and conditions'
        };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 2. E-commerce Product Validation

```typescript
interface Product {
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  tags: string[];
}

const productPouch = pouch<Product>(
  { name: '', price: 0, category: '', stock: 0, description: '', tags: [] },
  [
    validate((product) => {
      if (!product.name.trim()) {
        return { isValid: false, error: 'Product name is required' };
      }
      
      if (product.price <= 0) {
        return { isValid: false, error: 'Price must be greater than 0' };
      }
      
      if (product.stock < 0) {
        return { isValid: false, error: 'Stock cannot be negative' };
      }
      
      if (product.description.length < 10) {
        return { isValid: false, error: 'Description must be at least 10 characters' };
      }
      
      const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports'];
      if (!validCategories.includes(product.category)) {
        return { isValid: false, error: 'Invalid category' };
      }
      
      if (product.tags.length === 0) {
        return { isValid: false, error: 'At least one tag is required' };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 3. Financial Data Validation

```typescript
interface Transaction {
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  category: string;
  date: string;
  description: string;
}

const transactionPouch = pouch<Transaction>(
  { amount: 0, currency: 'USD', type: 'debit', category: '', date: '', description: '' },
  [
    validate((transaction) => {
      // Amount validation
      if (transaction.amount <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0' };
      }
      
      if (transaction.amount > 1000000) {
        return { isValid: false, error: 'Amount cannot exceed $1,000,000' };
      }
      
      // Currency validation
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      if (!validCurrencies.includes(transaction.currency)) {
        return { isValid: false, error: 'Invalid currency' };
      }
      
      // Date validation
      const transactionDate = new Date(transaction.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (transactionDate > today || transactionDate < oneYearAgo) {
        return { isValid: false, error: 'Date must be within the last year and not in the future' };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 4. Game Configuration Validation

```typescript
interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  playerCount: number;
  timeLimit: number; // in minutes
  enablePowerUps: boolean;
  mapSize: 'small' | 'medium' | 'large';
}

const gameSettings = pouch<GameSettings>(
  { difficulty: 'medium', playerCount: 1, timeLimit: 30, enablePowerUps: true, mapSize: 'medium' },
  [
    validate((settings) => {
      if (settings.playerCount < 1 || settings.playerCount > 8) {
        return { isValid: false, error: 'Player count must be between 1 and 8' };
      }
      
      if (settings.timeLimit < 5 || settings.timeLimit > 180) {
        return { isValid: false, error: 'Time limit must be between 5 and 180 minutes' };
      }
      
      // Validate combinations
      if (settings.difficulty === 'expert' && settings.playerCount > 4) {
        return { isValid: false, error: 'Expert mode supports maximum 4 players' };
      }
      
      if (settings.mapSize === 'small' && settings.playerCount > 4) {
        return { isValid: false, error: 'Small maps support maximum 4 players' };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 5. API Request Validation

```typescript
interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body: any;
  timeout: number;
}

const apiRequest = pouch<ApiRequest>(
  { endpoint: '', method: 'GET', headers: {}, body: null, timeout: 5000 },
  [
    validate((request) => {
      // URL validation
      try {
        new URL(request.endpoint);
      } catch {
        return { isValid: false, error: 'Invalid endpoint URL' };
      }
      
      // Timeout validation
      if (request.timeout < 1000 || request.timeout > 60000) {
        return { isValid: false, error: 'Timeout must be between 1 and 60 seconds' };
      }
      
      // Body validation for certain methods
      if (['POST', 'PUT'].includes(request.method) && !request.body) {
        return { isValid: false, error: 'POST and PUT requests require a body' };
      }
      
      // Headers validation
      if (request.headers['Content-Type'] && 
          !['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
            .includes(request.headers['Content-Type'])) {
        return { isValid: false, error: 'Unsupported Content-Type' };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 6. Chat Message Validation

```typescript
interface ChatMessage {
  content: string;
  type: 'text' | 'image' | 'file';
  recipient: string;
  isPrivate: boolean;
}

const messagePouch = pouch<ChatMessage>(
  { content: '', type: 'text', recipient: '', isPrivate: false },
  [
    validate((message) => {
      if (!message.content.trim()) {
        return { isValid: false, error: 'Message cannot be empty' };
      }
      
      if (message.content.length > 1000) {
        return { isValid: false, error: 'Message cannot exceed 1000 characters' };
      }
      
      // Check for banned words
      const bannedWords = ['spam', 'abuse', 'inappropriate'];
      const containsBanned = bannedWords.some(word => 
        message.content.toLowerCase().includes(word)
      );
      
      if (containsBanned) {
        return { isValid: false, error: 'Message contains inappropriate content' };
      }
      
      if (message.isPrivate && !message.recipient) {
        return { isValid: false, error: 'Private messages must have a recipient' };
      }
      
      return { isValid: true };
    })
  ]
);
```

### 7. Conditional Validation

```typescript
interface ConditionalData {
  type: 'personal' | 'business';
  personalInfo?: { ssn: string; age: number };
  businessInfo?: { taxId: string; employeeCount: number };
}

const conditionalPouch = pouch<ConditionalData>(
  { type: 'personal' },
  [
    validate((data) => {
      if (data.type === 'personal') {
        if (!data.personalInfo) {
          return { isValid: false, error: 'Personal information is required' };
        }
        
        if (!/^\d{3}-\d{2}-\d{4}$/.test(data.personalInfo.ssn)) {
          return { isValid: false, error: 'Invalid SSN format' };
        }
        
        if (data.personalInfo.age < 18) {
          return { isValid: false, error: 'Must be 18 or older' };
        }
      } else if (data.type === 'business') {
        if (!data.businessInfo) {
          return { isValid: false, error: 'Business information is required' };
        }
        
        if (!/^\d{2}-\d{7}$/.test(data.businessInfo.taxId)) {
          return { isValid: false, error: 'Invalid Tax ID format' };
        }
        
        if (data.businessInfo.employeeCount < 1) {
          return { isValid: false, error: 'Employee count must be at least 1' };
        }
      }
      
      return { isValid: true };
    })
  ]
);
```

### 8. Combining with Other Plugins

```typescript
const validatedUser = pouch(
  { name: '', email: '', age: 0 },
  [
    // First clean/transform the data
    middleware((user) => ({
      ...user,
      name: user.name.trim(),
      email: user.email.toLowerCase().trim()
    })),
    // Then validate
    validate((user) => ({
      isValid: user.name.length >= 2 && 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) &&
               user.age >= 0,
      error: 'Invalid user data'
    })),
    // Then persist if valid
    persist('user-data'),
    // And log the change
    logger('User')
  ]
);
```

## Error Handling

```typescript
const Form = () => {
  const handleSubmit = (formData: any) => {
    try {
      formPouch.set(formData);
      // Form is valid, proceed
      console.log('Form submitted successfully');
    } catch (error) {
      // Validation failed
      setErrorMessage(error.message);
      console.error('Validation error:', error.message);
    }
  };
  
  // ...rest of component
};
```

## Notes

- Validation runs synchronously before state updates are applied
- Validation errors are thrown as Error objects, not logged
- Multiple validators are executed in order - the first failure stops execution
- Use validation for business logic and data integrity constraints
- For simple type checking, consider the `schema` plugin instead
- Validation happens after middleware transformations
- Function updates are resolved before validation
- Handle validation errors appropriately in your UI
- Consider async validation by using the validate plugin with middleware for server-side checks
- Validator functions should be pure and not have side effects