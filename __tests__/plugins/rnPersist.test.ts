import { store } from '../../src/core/store';
import { rnPersist } from '../../src/plugins/rnPersist';

describe('React Native Persist Plugin', () => {
  let mockAsyncStorage: any;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create mock AsyncStorage
    mockAsyncStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should create rnPersist plugin without errors', () => {
      expect(() => rnPersist('test-key', { asyncStorage: mockAsyncStorage })).not.toThrow();
    });

    it('should load stored value asynchronously', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('{"count":5,"name":"test"}');

      const testStore = store({ count: 0, name: '' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      // Initially should have default value
      expect(testStore.get()).toEqual({ count: 0, name: '' });

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(testStore.get()).toEqual({ count: 5, name: 'test' });
    });

    it('should keep initial value when no stored data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const testStore = store({ count: 0 }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual({ count: 0 });
    });

    it('should persist data when store value changes', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const testStore = store({ count: 0 }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      testStore.set({ count: 5 });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', '{"count":5}');
    });
  });

  describe('Async Operations', () => {
    it('should handle async data loading properly', async () => {
      const storedData = { user: { name: 'John', age: 30 }, settings: { theme: 'dark' } };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedData));

      const testStore = store({ user: null, settings: {} }, [
        rnPersist('user-data', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual(storedData);
    });

    it('should handle multiple rapid updates efficiently', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store({ count: 0 }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      // Make rapid updates
      testStore.set({ count: 1 });
      testStore.set({ count: 2 });
      testStore.set({ count: 3 });

      // Wait for all async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have called setItem for each update
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith('test-key', '{"count":3}');
    });

    it('should work with function updates', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('{"count":5}');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store({ count: 0 }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      testStore.set(prev => ({ count: prev.count + 10 }));

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith('test-key', '{"count":15}');
    });
  });

  describe('Custom Serialization', () => {
    it('should use custom serialize function', async () => {
      const customSerialize = jest.fn((value) => `custom:${JSON.stringify(value)}`);
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store({ data: 'test' }, [
        rnPersist('test-key', { 
          asyncStorage: mockAsyncStorage,
          serialize: customSerialize
        })
      ]);

      testStore.set({ data: 'updated' });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(customSerialize).toHaveBeenCalledWith({ data: 'updated' });
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'custom:{"data":"updated"}');
    });

    it('should use custom deserialize function', async () => {
      const customDeserialize = jest.fn((str) => {
        const data = str.replace('custom:', '');
        return JSON.parse(data);
      });
      
      mockAsyncStorage.getItem.mockResolvedValueOnce('custom:{"data":"stored"}');

      const testStore = store({ data: 'default' }, [
        rnPersist('test-key', {
          asyncStorage: mockAsyncStorage,
          deserialize: customDeserialize
        })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(customDeserialize).toHaveBeenCalledWith('custom:{"data":"stored"}');
      expect(testStore.get()).toEqual({ data: 'stored' });
    });

    it('should handle Map serialization', async () => {
      const mapSerialize = (value: Map<string, any>) => JSON.stringify(Array.from(value.entries()));
      const mapDeserialize = (str: string) => new Map(JSON.parse(str));

      mockAsyncStorage.getItem.mockResolvedValueOnce('[["key1","value1"],["key2","value2"]]');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store(new Map(), [
        rnPersist('map-data', {
          asyncStorage: mockAsyncStorage,
          serialize: mapSerialize,
          deserialize: mapDeserialize
        })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = testStore.get() as Map<string, any>;
      
      expect(result instanceof Map).toBe(true);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
    });

    it('should handle Set serialization', async () => {
      const setSerialize = (value: Set<any>) => JSON.stringify(Array.from(value));
      const setDeserialize = (str: string) => new Set(JSON.parse(str));

      mockAsyncStorage.getItem.mockResolvedValueOnce('["item1","item2","item3"]');

      const testStore = store(new Set(), [
        rnPersist('set-data', {
          asyncStorage: mockAsyncStorage,
          serialize: setSerialize,
          deserialize: setDeserialize
        })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = testStore.get() as Set<any>;
      
      expect(result instanceof Set).toBe(true);
      expect(result.has('item1')).toBe(true);
      expect(result.has('item2')).toBe(true);
      expect(result.has('item3')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage getItem errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));

      const testStore = store({ default: 'value' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual({ default: 'value' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'rnPersist: Failed to load data for key "test-key":',
        expect.any(Error)
      );
    });

    it('should handle AsyncStorage setItem errors gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      const testStore = store({ data: 'test' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      testStore.set({ data: 'updated' });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'rnPersist: Failed to save data for key "test-key":',
        expect.any(Error)
      );
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json {');

      const testStore = store({ default: 'value' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual({ default: 'value' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'rnPersist: Failed to parse stored data for key "test-key":',
        expect.any(Error)
      );
    });

    it('should handle circular references gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Create circular reference
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const testStore = store({ data: 'initial' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]);

      testStore.set(circularObj);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        '{"name":"test","self":"[Circular]"}'
      );
    });

    it('should handle missing AsyncStorage gracefully', () => {
      const plugin = rnPersist('test-key'); // No asyncStorage provided

      expect(() => {
        const mockPouch = {
          get: jest.fn(),
          set: jest.fn(),
          subscribe: jest.fn(),
          use: jest.fn(),
        };

        if (plugin.setup) {
          plugin.setup(mockPouch);
        }
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'rnPersist: AsyncStorage not available. Install @react-native-async-storage/async-storage or provide asyncStorage option.'
      );
    });
  });

  describe('Storage Management', () => {
    it('should provide clearStorage method', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      const testStore = store({ data: 'test' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]) as any;

      await testStore.clearStorage();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle clearStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove failed'));

      const testStore = store({ data: 'test' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]) as any;

      await testStore.clearStorage();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'rnPersist: Failed to clear data for key "test-key":',
        expect.any(Error)
      );
    });

    it('should provide storage info', () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const testStore = store({ data: 'test' }, [
        rnPersist('test-key', { asyncStorage: mockAsyncStorage })
      ]) as any;

      const info = testStore.getStorageInfo();

      expect(info).toEqual({
        key: 'test-key',
        available: true,
        type: 'AsyncStorage'
      });
    });

    it('should indicate unavailable storage in info', () => {
      const testStore = store({ data: 'test' }, [
        rnPersist('test-key') // No asyncStorage
      ]) as any;

      const info = testStore.getStorageInfo();

      expect(info).toEqual({
        key: 'test-key',
        available: false,
        type: 'AsyncStorage'
      });
    });
  });

  describe('Complex Data Types', () => {
    it('should handle nested objects', async () => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false
              }
            }
          }
        },
        settings: {
          language: 'en',
          timezone: 'UTC'
        }
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(complexData));

      const testStore = store({}, [
        rnPersist('complex-data', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual(complexData);
    });

    it('should handle arrays with mixed types', async () => {
      const arrayData = [
        { id: 1, name: 'Item 1', active: true },
        { id: 2, name: 'Item 2', active: false },
        { id: 3, name: 'Item 3', active: true, metadata: { color: 'blue', priority: 'high' } }
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(arrayData));

      const testStore = store([], [
        rnPersist('array-data', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = testStore.get();
      expect(result).toEqual(arrayData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should handle primitive types', async () => {
      const testCases = [
        { stored: '"hello world"', expected: 'hello world', key: 'string-test' },
        { stored: '42', expected: 42, key: 'number-test' },
        { stored: 'true', expected: true, key: 'boolean-test' },
        { stored: 'false', expected: false, key: 'boolean-false-test' },
        { stored: 'null', expected: null, key: 'null-test' }
      ];

      for (const testCase of testCases) {
        mockAsyncStorage.getItem.mockResolvedValueOnce(testCase.stored);

        const testStore = store('default', [
          rnPersist(testCase.key, { asyncStorage: mockAsyncStorage })
        ]);

        // Wait for async load
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(testStore.get()).toBe(testCase.expected);
      }
    });
  });

  describe('Integration with Other Plugins', () => {
    it('should work with validation plugin', async () => {
      const validator = (value: { email: string }) => ({
        isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email),
        error: 'Invalid email format'
      });

      mockAsyncStorage.getItem.mockResolvedValueOnce('{"email":"test@example.com"}');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Import validate plugin for this test
      const { validate } = require('../../src/plugins/validate');

      const testStore = store({ email: '' }, [
        rnPersist('user-email', { asyncStorage: mockAsyncStorage }),
        validate(validator)
      ]);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual({ email: 'test@example.com' });

      // Valid update should work
      expect(() => testStore.set({ email: 'new@example.com' })).not.toThrow();

      // Invalid update should throw
      expect(() => testStore.set({ email: 'invalid-email' })).toThrow('Invalid email format');
    });

    it('should work with logger plugin', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Import logger plugin for this test
      const { logger } = require('../../src/plugins/logger');

      const testStore = store({ count: 0 }, [
        rnPersist('counter', { asyncStorage: mockAsyncStorage }),
        logger('Counter')
      ]);

      testStore.set({ count: 5 });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('counter', '{"count":5}');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        metadata: {
          created: new Date().toISOString(),
          tags: [`tag${i % 10}`, `category${i % 5}`],
          active: i % 2 === 0
        }
      }));

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(largeData));

      const start = performance.now();
      
      const testStore = store([], [
        rnPersist('large-data', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const end = performance.now();

      const result = testStore.get();
      expect(result).toHaveLength(1000);
      expect(end - start).toBeLessThan(200); // Should complete in under 200ms
    });

    it('should handle frequent updates without blocking', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store({ counter: 0 }, [
        rnPersist('performance-test', { asyncStorage: mockAsyncStorage })
      ]);

      const start = performance.now();
      
      // Make 100 rapid updates
      for (let i = 1; i <= 100; i++) {
        testStore.set({ counter: i });
      }
      
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // Should complete quickly (sync part)
      expect(testStore.get()).toEqual({ counter: 100 });

      // Wait for all async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      expect(() => {
        rnPersist('', { asyncStorage: mockAsyncStorage });
      }).not.toThrow();
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      expect(() => {
        rnPersist(longKey, { asyncStorage: mockAsyncStorage });
      }).not.toThrow();
    });

    it('should handle undefined and null values', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const testStore = store(null, [
        rnPersist('null-test', { asyncStorage: mockAsyncStorage })
      ]);

      testStore.set(undefined as any);
      testStore.set(null);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('null-test', 'null');
    });

    it('should handle special characters in data', async () => {
      const specialData = {
        text: 'Special chars: éñ中文🚀"\'\\\/\n\t\r',
        unicode: '𝒽𝑒𝓁𝓁𝑜 𝓌𝑜𝓇𝓁𝒹',
        emoji: '🎉🔥💯✨🚀💡🎯📱💻🌟'
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(specialData));

      const testStore = store({}, [
        rnPersist('special-chars', { asyncStorage: mockAsyncStorage })
      ]);

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(testStore.get()).toEqual(specialData);
    });
  });
});