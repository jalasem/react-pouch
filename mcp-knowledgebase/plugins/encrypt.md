# Encrypt Plugin

The encrypt plugin provides basic encryption for pouch state values. It automatically encrypts data when setting values and decrypts when retrieving them. Note that this plugin uses a simple XOR cipher for demonstration - use proper encryption libraries for production applications.

## Import

```typescript
import { encrypt } from 'react-pouch/plugins';
```

## Configuration

The encrypt plugin requires a secret key:

```typescript
encrypt(secretKey: string)
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { encrypt } from 'react-pouch/plugins';

const securePouch = pouch(
  { password: 'secret123', apiKey: 'abc-def-ghi' },
  [
    encrypt('my-secret-key')
  ]
);

// Data is automatically encrypted when set
securePouch.set({ password: 'newSecret456', apiKey: 'xyz-123-456' });

// Data is automatically decrypted when retrieved
console.log(securePouch.get()); // { password: 'newSecret456', apiKey: 'xyz-123-456' }
```

### With Persistence

```typescript
import { pouch } from 'react-pouch';
import { encrypt, persist } from 'react-pouch/plugins';

const credentials = pouch(
  { token: '', refreshToken: '', expiresAt: null },
  [
    encrypt('super-secret-key-123'),
    persist('user-credentials')  // Stored encrypted in localStorage
  ]
);

// Token is encrypted before being saved to localStorage
credentials.set({
  token: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'refresh-token-here',
  expiresAt: new Date().getTime() + 3600000
});
```

### Handling Encrypted Initial Values

```typescript
// If you have pre-encrypted data (e.g., from localStorage)
const encryptedValue = 'encrypted:YmFzZTY0ZW5jb2RlZA==';

const pouch = pouch(
  encryptedValue,  // Will be automatically decrypted
  [
    encrypt('my-secret-key')
  ]
);
```

## API Methods

This plugin doesn't add any methods to the pouch instance. It works transparently by intercepting get/set operations.

## Common Use Cases

### 1. Storing Authentication Tokens

```typescript
interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  permissions: string[];
}

const authPouch = pouch<AuthState>(
  { accessToken: '', refreshToken: '', userId: '', permissions: [] },
  [
    encrypt(process.env.REACT_APP_ENCRYPT_KEY || 'fallback-key'),
    persist('auth-state')
  ]
);

// Tokens are encrypted in localStorage
authPouch.set({
  accessToken: 'bearer-token-123',
  refreshToken: 'refresh-token-456',
  userId: 'user-789',
  permissions: ['read', 'write']
});
```

### 2. Protecting Sensitive User Data

```typescript
interface UserProfile {
  ssn: string;
  creditCard: string;
  bankAccount: string;
  publicInfo: {
    name: string;
    avatar: string;
  };
}

const profilePouch = pouch<UserProfile>(
  {
    ssn: '',
    creditCard: '',
    bankAccount: '',
    publicInfo: { name: '', avatar: '' }
  },
  [
    encrypt('user-specific-encryption-key'),
    persist('user-profile')
  ]
);
```

### 3. Secure Form Data

```typescript
const paymentForm = pouch(
  {
    cardNumber: '',
    cvv: '',
    expiryDate: '',
    billingAddress: ''
  },
  [
    encrypt('payment-encryption-key'),
    validate((data) => ({
      isValid: data.cardNumber.length === 16 && data.cvv.length === 3,
      error: 'Invalid card details'
    }))
  ]
);
```

### 4. API Keys and Secrets

```typescript
interface ApiConfig {
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  environment: 'dev' | 'staging' | 'prod';
}

const configPouch = pouch<ApiConfig>(
  {
    apiKey: '',
    apiSecret: '',
    webhookSecret: '',
    environment: 'dev'
  },
  [
    encrypt('config-encryption-key'),
    persist('api-config'),
    logger('ApiConfig', { collapsed: true })
  ]
);
```

### 5. Encrypted Communication State

```typescript
interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

const messagesPouch = pouch<ChatMessage[]>(
  [],
  [
    encrypt('chat-encryption-key'),
    history(50),  // Keep encrypted history
    sync('/api/messages', {
      headers: {
        'X-Encryption': 'enabled'
      }
    })
  ]
);
```

## Security Considerations

### Important Warning

The built-in encryption uses a simple XOR cipher which is **NOT secure** for production use. For real applications, you should:

1. Use a proper encryption library like `crypto-js` or `node-forge`
2. Implement proper key management
3. Use authenticated encryption (AES-GCM, ChaCha20-Poly1305)
4. Consider key rotation strategies

### Example with Proper Encryption

```typescript
import CryptoJS from 'crypto-js';

// Custom encrypt plugin with AES
function aesEncrypt(secretKey: string): SimplePlugin<any> {
  return {
    initialize(value: any): any {
      if (typeof value === 'string' && value.startsWith('aes:')) {
        try {
          const encrypted = value.slice(4);
          const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey);
          return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        } catch (error) {
          console.error('Decryption failed:', error);
          return value;
        }
      }
      return value;
    },

    onSet(newValue: any): any {
      try {
        const stringified = JSON.stringify(newValue);
        const encrypted = CryptoJS.AES.encrypt(stringified, secretKey);
        return 'aes:' + encrypted.toString();
      } catch (error) {
        console.error('Encryption failed:', error);
        return newValue;
      }
    }
  };
}
```

## Notes

- Encryption happens automatically on every state update
- Decryption happens when accessing the state
- The encrypted data is prefixed with "encrypted:" to identify it
- If decryption fails, the original value is returned with an error logged
- Works seamlessly with other plugins like `persist` and `sync`
- For React Native, combine with `rnPersist` for encrypted AsyncStorage
- Performance consideration: encryption/decryption adds overhead to every state operation
- The encryption key should be stored securely and never exposed in client-side code