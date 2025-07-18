import { store } from '../../src/core/store';
import { encrypt } from '../../src/plugins/encrypt';

// Mock base64 functions for consistent testing
const mockBtoa = jest.fn();
const mockAtob = jest.fn();

// Store original functions
const originalBtoa = global.btoa;
const originalAtob = global.atob;

describe('Encrypt Plugin', () => {
  beforeEach(() => {
    // Mock btoa and atob
    global.btoa = mockBtoa;
    global.atob = mockAtob;
    
    // Default implementations
    mockBtoa.mockImplementation((str: string) => Buffer.from(str, 'binary').toString('base64'));
    mockAtob.mockImplementation((str: string) => Buffer.from(str, 'base64').toString('binary'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original functions
    global.btoa = originalBtoa;
    global.atob = originalAtob;
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt values on set', () => {
      const testStore = store('hello world', [encrypt('secret123')]);
      
      testStore.set('test message');
      const storedValue = testStore.get();
      
      expect(typeof storedValue).toBe('string');
      expect(storedValue).toMatch(/^encrypted:/);
      expect(storedValue).not.toContain('test message');
    });

    it('should decrypt values on initialize', () => {
      const secretKey = 'secret123';
      const plainValue = { message: 'hello', count: 42 };
      
      // Create store and set a value to encrypt it
      const testStore = store(plainValue, [encrypt(secretKey)]);
      testStore.set(plainValue);
      const encryptedValue = testStore.get();
      
      // Create new store with encrypted value as initial value
      const newStore = store(encryptedValue, [encrypt(secretKey)]);
      
      expect(newStore.get()).toEqual(plainValue);
    });

    it('should handle round-trip encryption/decryption', () => {
      const secretKey = 'mySecretKey';
      const originalValue = { name: 'John', age: 30, active: true };
      
      // Store 1: Encrypt the value
      const store1 = store(originalValue, [encrypt(secretKey)]);
      store1.set(originalValue);
      const encryptedValue = store1.get();
      
      // Store 2: Use encrypted value as initial value
      const store2 = store(encryptedValue, [encrypt(secretKey)]);
      
      expect(store2.get()).toEqual(originalValue);
    });

    it('should work with primitive types', () => {
      const secretKey = 'testkey';
      
      // Test with string
      const stringStore = store('hello', [encrypt(secretKey)]);
      stringStore.set('world');
      expect(stringStore.get()).toMatch(/^encrypted:/);
      
      // Test with number
      const numberStore = store(42, [encrypt(secretKey)]);
      numberStore.set(100);
      expect(numberStore.get()).toMatch(/^encrypted:/);
      
      // Test with boolean
      const boolStore = store(true, [encrypt(secretKey)]);
      boolStore.set(false);
      expect(boolStore.get()).toMatch(/^encrypted:/);
    });

    it('should work with complex objects', () => {
      const secretKey = 'complexKey';
      const complexValue = {
        user: {
          id: 1,
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        items: ['item1', 'item2'],
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      const testStore = store(complexValue, [encrypt(secretKey)]);
      testStore.set(complexValue);
      const encryptedValue = testStore.get();
      
      expect(encryptedValue).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encryptedValue, [encrypt(secretKey)]);
      expect(newStore.get()).toEqual(complexValue);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Stringify error');
      });
      
      const testStore = store('test', [encrypt('secret')]);
      testStore.set('test value');
      
      expect(testStore.get()).toBe('test value'); // Should return original value
      expect(consoleSpy).toHaveBeenCalledWith('Failed to encrypt:', expect.any(Error));
      
      // Restore
      JSON.stringify = originalStringify;
      consoleSpy.mockRestore();
    });

    it('should handle decryption errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock atob to throw an error
      mockAtob.mockImplementation(() => {
        throw new Error('Decryption error');
      });
      
      const testStore = store('encrypted:invaliddata', [encrypt('secret')]);
      
      expect(testStore.get()).toBe('encrypted:invaliddata'); // Should return original value
      expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed encrypted data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock atob to return invalid JSON
      mockAtob.mockReturnValue('invalid json');
      
      const testStore = store('encrypted:malformed', [encrypt('secret')]);
      
      expect(testStore.get()).toBe('encrypted:malformed'); // Should return original value
      expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle empty secret key', () => {
      const testStore = store('test', [encrypt('')]);
      
      // Should still work but with empty key
      testStore.set('hello');
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
    });

    it('should handle non-string initial values that look encrypted', () => {
      const testStore = store({ data: 'encrypted:fake' }, [encrypt('secret')]);
      
      // Should not try to decrypt object values
      expect(testStore.get()).toEqual({ data: 'encrypted:fake' });
    });
  });

  describe('Security Considerations', () => {
    it('should use different encrypted values for same input with different keys', () => {
      const plainValue = { secret: 'confidential' };
      
      const store1 = store(plainValue, [encrypt('key1')]);
      const store2 = store(plainValue, [encrypt('key2')]);
      
      store1.set(plainValue);
      store2.set(plainValue);
      
      const encrypted1 = store1.get();
      const encrypted2 = store2.get();
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(encrypted1).toMatch(/^encrypted:/);
      expect(encrypted2).toMatch(/^encrypted:/);
    });

    it('should not be able to decrypt with wrong key', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const originalValue = { secret: 'data' };
      
      // Encrypt with one key
      const store1 = store(originalValue, [encrypt('correctkey')]);
      store1.set(originalValue);
      const encrypted = store1.get();
      
      // Try to decrypt with different key
      const store2 = store(encrypted, [encrypt('wrongkey')]);
      
      // Should not be able to decrypt properly
      expect(store2.get()).not.toEqual(originalValue);
      
      consoleSpy.mockRestore();
    });

    it('should handle special characters in secret key', () => {
      const specialKey = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
      const testValue = { data: 'test' };
      
      const testStore = store(testValue, [encrypt(specialKey)]);
      testStore.set(testValue);
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encrypted, [encrypt(specialKey)]);
      expect(newStore.get()).toEqual(testValue);
    });
  });

  describe('Performance', () => {
    it('should handle large objects efficiently', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(10)
        }))
      };
      
      const testStore = store(largeObject, [encrypt('perfkey')]);
      
      const start = performance.now();
      testStore.set(largeObject);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(500); // Should complete quickly
      expect(testStore.get()).toMatch(/^encrypted:/);
    });

    it('should handle frequent encryption/decryption operations', () => {
      const testStore = store({ counter: 0 }, [encrypt('freqkey')]);
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        testStore.set({ counter: i });
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(200); // Should handle frequent operations
      expect(testStore.get()).toMatch(/^encrypted:/);
    });
  });

  describe('Integration with Store', () => {
    it('should work with store subscriptions', () => {
      const testStore = store({ count: 0 }, [encrypt('subkey')]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set({ count: 1 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(testStore.get()).toMatch(/^encrypted:/);
    });

    it('should work with function updates', () => {
      const testStore = store({ count: 0 }, [encrypt('funckey')]);
      
      testStore.set(prev => ({ count: prev.count + 1 }));
      
      // Value should be encrypted
      expect(testStore.get()).toMatch(/^encrypted:/);
    });

    it('should work with multiple plugins', () => {
      const validate = jest.fn().mockReturnValue(true);
      const mockValidatePlugin = {
        onSet: validate
      };
      
      const testStore = store({ data: 'test' }, [
        mockValidatePlugin,
        encrypt('multikey')
      ]);
      
      testStore.set({ data: 'new value' });
      
      expect(validate).toHaveBeenCalled();
      expect(testStore.get()).toMatch(/^encrypted:/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const testStore = store<string | null>('test', [encrypt('nullkey')]);
      
      testStore.set(null);
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encrypted, [encrypt('nullkey')]);
      expect(newStore.get()).toBeNull();
    });

    it('should handle undefined values', () => {
      const testStore = store<string | undefined>('test', [encrypt('undefkey')]);
      
      testStore.set(undefined);
      const encrypted = testStore.get();
      
      // Should return undefined due to encryption error
      expect(encrypted).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const testStore = store('test', [encrypt('emptykey')]);
      
      testStore.set('');
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encrypted, [encrypt('emptykey')]);
      expect(newStore.get()).toBe('');
    });

    it('should handle empty arrays', () => {
      const testStore = store([1, 2, 3], [encrypt('arrkey')]);
      
      testStore.set([]);
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encrypted, [encrypt('arrkey')]);
      expect(newStore.get()).toEqual([]);
    });

    it('should handle empty objects', () => {
      const testStore = store({ key: 'value' }, [encrypt('objkey')]);
      
      testStore.set({} as any);
      const encrypted = testStore.get();
      
      expect(encrypted).toMatch(/^encrypted:/);
      
      // Test decryption
      const newStore = store(encrypted, [encrypt('objkey')]);
      expect(newStore.get()).toEqual({});
    });

    it('should handle circular references gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const testStore = store(circular, [encrypt('circkey')]);
      testStore.set(circular);
      
      // Should handle JSON.stringify error gracefully
      expect(testStore.get()).toBe(circular); // Should return original value
      expect(consoleSpy).toHaveBeenCalledWith('Failed to encrypt:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with different types', () => {
      // String type
      const stringStore = store<string>('test', [encrypt('typekey')]);
      stringStore.set('new value');
      expect(typeof stringStore.get()).toBe('string');
      
      // Number type
      const numberStore = store<number>(42, [encrypt('typekey')]);
      numberStore.set(100);
      expect(typeof numberStore.get()).toBe('string'); // Encrypted values are strings
      
      // Object type
      interface User {
        id: number;
        name: string;
      }
      const userStore = store<User>({ id: 1, name: 'John' }, [encrypt('typekey')]);
      userStore.set({ id: 2, name: 'Jane' });
      expect(typeof userStore.get()).toBe('string'); // Encrypted values are strings
    });
  });
});