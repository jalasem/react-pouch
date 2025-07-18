import { store } from '../../src/core/store';
import { persist } from '../../src/plugins/persist';
import { rnPersist } from '../../src/plugins/rnPersist';

describe('Persistence Plugin Comparison', () => {
  let mockLocalStorage: any;
  let mockAsyncStorage: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock localStorage for persist plugin
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock AsyncStorage for rnPersist plugin
    mockAsyncStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Primitive Values Persistence', () => {
    const primitiveTestCases = [
      { type: 'string', value: 'hello world', serialized: '"hello world"' },
      { type: 'number', value: 42, serialized: '42' },
      { type: 'boolean true', value: true, serialized: 'true' },
      { type: 'boolean false', value: false, serialized: 'false' },
      { type: 'null', value: null, serialized: 'null' },
      // Note: undefined is not a valid JSON value, so we skip testing it in persistence
    ];

    primitiveTestCases.forEach(({ type, value, serialized }) => {
      it(`should persist and restore ${type} values in both plugins`, async () => {
        // Test persist plugin
        mockLocalStorage.getItem.mockReturnValueOnce(serialized);
        const persistStore = store<any>('default', [persist(`${type}-test`)]);
        
        // Wait for synchronous initialization
        if (serialized !== undefined) {
          expect(persistStore.get()).toBe(value === undefined ? null : value);
        }

        // Test setting and getting back
        if (value !== undefined) {
          persistStore.set(value as any);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            `${type}-test`, 
            JSON.stringify(value)
          );
        }

        // Test rnPersist plugin
        mockAsyncStorage.getItem.mockResolvedValueOnce(serialized);
        const rnPersistStore = store<any>('default', [
          rnPersist(`rn-${type}-test`, { asyncStorage: mockAsyncStorage })
        ]);

        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (serialized !== undefined) {
          expect(rnPersistStore.get()).toBe(value === undefined ? null : value);
        }

        // Test setting and getting back
        if (value !== undefined) {
          rnPersistStore.set(value as any);
          await new Promise(resolve => setTimeout(resolve, 0));
          
          expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
            `rn-${type}-test`, 
            JSON.stringify(value)
          );
        }
      });
    });

    it('should handle special string values', () => {
      const specialStrings = [
        '',
        ' ',
        '\n\t\r',
        'emoji: 🚀🎉💯',
        'unicode: éñ中文',
        'quotes: "\'`',
        'json-like: {"key": "value"}',
        'very long string: ' + 'a'.repeat(1000),
      ];

      specialStrings.forEach((str, index) => {
        // Test persist plugin
        mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(str));
        const persistStore = store('', [persist(`string-${index}`)]);
        expect(persistStore.get()).toBe(str);

        persistStore.set(str);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`string-${index}`, JSON.stringify(str));
      });
    });

    it('should handle numeric edge cases', () => {
      const numericCases = [
        0,
        -0,
        Infinity,
        -Infinity,
        NaN,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        3.14159,
        -273.15,
      ];

      numericCases.forEach((num, index) => {
        // Test persist plugin
        const serialized = JSON.stringify(num);
        mockLocalStorage.getItem.mockReturnValueOnce(serialized);
        const persistStore = store(0, [persist(`number-${index}`)]);
        
        const retrieved = persistStore.get();
        if (Number.isNaN(num)) {
          expect(retrieved).toBeNull(); // NaN becomes null in JSON
        } else if (num === Infinity || num === -Infinity) {
          expect(retrieved).toBeNull(); // Infinity becomes null in JSON
        } else if (Object.is(num, -0)) {
          expect(Object.is(retrieved, -0) || retrieved === 0).toBe(true); // -0 becomes 0 in JSON
        } else {
          expect(retrieved).toBe(num);
        }
      });
    });
  });

  describe('Non-Primitive Values Persistence', () => {
    it('should persist and restore objects', async () => {
      const testObject = {
        id: 1,
        name: 'John Doe',
        active: true,
        score: 95.5,
        metadata: null,
        tags: ['admin', 'user'],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testObject));
      const persistStore = store({}, [persist('object-test')]);
      expect(persistStore.get()).toEqual(testObject);

      persistStore.set(testObject);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('object-test', JSON.stringify(testObject));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testObject));
      const rnPersistStore = store({}, [
        rnPersist('rn-object-test', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(rnPersistStore.get()).toEqual(testObject);

      rnPersistStore.set(testObject);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('rn-object-test', JSON.stringify(testObject));
    });

    it('should persist and restore arrays', async () => {
      const testArray = [
        1,
        'string',
        true,
        null,
        { id: 1, name: 'Item 1' },
        [1, 2, 3],
        { nested: { deep: { value: 'deep' } } },
      ];

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testArray));
      const persistStore = store<any[]>([], [persist('array-test')]);
      expect(persistStore.get()).toEqual(testArray);

      persistStore.set(testArray);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('array-test', JSON.stringify(testArray));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testArray));
      const rnPersistStore = store<any[]>([], [
        rnPersist('rn-array-test', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(rnPersistStore.get()).toEqual(testArray);

      rnPersistStore.set(testArray);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('rn-array-test', JSON.stringify(testArray));
    });

    it('should persist deeply nested structures', async () => {
      const deepStructure = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deep value',
                  array: [{ nested: true }, { value: 42 }],
                  metadata: {
                    created: '2023-01-01',
                    tags: ['deep', 'nested', 'structure'],
                  },
                },
              },
            },
          },
        },
        parallel: {
          branch: {
            data: 'parallel data',
          },
        },
      };

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(deepStructure));
      const persistStore = store({}, [persist('deep-test')]);
      expect(persistStore.get()).toEqual(deepStructure);

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(deepStructure));
      const rnPersistStore = store({}, [
        rnPersist('rn-deep-test', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(rnPersistStore.get()).toEqual(deepStructure);
    });

    it('should handle arrays with mixed primitive and non-primitive types', async () => {
      const mixedArray = [
        // Primitives
        42,
        'string',
        true,
        null,
        // Objects
        { id: 1, name: 'Object 1' },
        { id: 2, nested: { value: 'nested' } },
        // Nested arrays
        [1, 2, 3],
        ['a', 'b', 'c'],
        [{ nested: 'array' }],
        // Complex structures
        {
          array: [1, 2, { deep: true }],
          object: { array: ['nested'] },
        },
      ];

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mixedArray));
      const persistStore = store<any[]>([], [persist('mixed-array-test')]);
      expect(persistStore.get()).toEqual(mixedArray);

      persistStore.set(mixedArray);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('mixed-array-test', JSON.stringify(mixedArray));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mixedArray));
      const rnPersistStore = store<any[]>([], [
        rnPersist('rn-mixed-array-test', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(rnPersistStore.get()).toEqual(mixedArray);

      rnPersistStore.set(mixedArray);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('rn-mixed-array-test', JSON.stringify(mixedArray));
    });
  });

  describe('Custom Serialization for Complex Types', () => {
    it('should handle Map serialization consistently', async () => {
      const testMap = new Map<any, any>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
        ['key3', [1, 2, 3]],
        [42, 'numeric key'],
        [true, 'boolean key'],
      ]);

      const mapSerialize = (value: Map<any, any>) => JSON.stringify(Array.from(value.entries()));
      const mapDeserialize = (str: string) => new Map(JSON.parse(str));

      // Test persist plugin
      const mapData = JSON.stringify(Array.from(testMap.entries()));
      mockLocalStorage.getItem.mockReturnValueOnce(mapData);
      
      const persistStore = store(new Map(), [
        persist('map-test', {
          serialize: mapSerialize,
          deserialize: mapDeserialize,
        })
      ]);

      const persistResult = persistStore.get() as Map<any, any>;
      expect(persistResult instanceof Map).toBe(true);
      expect(Array.from(persistResult.entries())).toEqual(Array.from(testMap.entries()));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(mapData);
      
      const rnPersistStore = store(new Map(), [
        rnPersist('rn-map-test', {
          asyncStorage: mockAsyncStorage,
          serialize: mapSerialize,
          deserialize: mapDeserialize,
        })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const rnPersistResult = rnPersistStore.get() as Map<any, any>;
      expect(rnPersistResult instanceof Map).toBe(true);
      expect(Array.from(rnPersistResult.entries())).toEqual(Array.from(testMap.entries()));
    });

    it('should handle Set serialization consistently', async () => {
      const testSet = new Set([
        'string value',
        42,
        true,
        { object: 'value' },
        [1, 2, 3],
        null,
      ]);

      const setSerialize = (value: Set<any>) => JSON.stringify(Array.from(value));
      const setDeserialize = (str: string) => new Set(JSON.parse(str));

      // Test persist plugin
      const setData = JSON.stringify(Array.from(testSet));
      mockLocalStorage.getItem.mockReturnValueOnce(setData);
      
      const persistStore = store(new Set(), [
        persist('set-test', {
          serialize: setSerialize,
          deserialize: setDeserialize,
        })
      ]);

      const persistResult = persistStore.get() as Set<any>;
      expect(persistResult instanceof Set).toBe(true);
      expect(Array.from(persistResult)).toEqual(Array.from(testSet));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(setData);
      
      const rnPersistStore = store(new Set(), [
        rnPersist('rn-set-test', {
          asyncStorage: mockAsyncStorage,
          serialize: setSerialize,
          deserialize: setDeserialize,
        })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const rnPersistResult = rnPersistStore.get() as Set<any>;
      expect(rnPersistResult instanceof Set).toBe(true);
      expect(Array.from(rnPersistResult)).toEqual(Array.from(testSet));
    });

    it('should handle Date serialization consistently', async () => {
      const testDate = new Date('2023-07-18T12:00:00.000Z');

      const dateSerialize = (value: Date) => value.toISOString();
      const dateDeserialize = (str: string) => new Date(str);

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(testDate.toISOString());
      
      const persistStore = store(new Date(), [
        persist('date-test', {
          serialize: dateSerialize,
          deserialize: dateDeserialize,
        })
      ]);

      const persistResult = persistStore.get() as Date;
      expect(persistResult instanceof Date).toBe(true);
      expect(persistResult.getTime()).toBe(testDate.getTime());

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(testDate.toISOString());
      
      const rnPersistStore = store(new Date(), [
        rnPersist('rn-date-test', {
          asyncStorage: mockAsyncStorage,
          serialize: dateSerialize,
          deserialize: dateDeserialize,
        })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const rnPersistResult = rnPersistStore.get() as Date;
      expect(rnPersistResult instanceof Date).toBe(true);
      expect(rnPersistResult.getTime()).toBe(testDate.getTime());
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle circular references gracefully', async () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const persistStore = store({ data: 'initial' }, [persist('circular-test')]);
      
      // Should not throw and should persist with circular references replaced
      expect(() => persistStore.set(circularObj)).not.toThrow();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('circular-test', '{"name":"test","self":"[Circular]"}');

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      const rnPersistStore = store({ data: 'initial' }, [
        rnPersist('rn-circular-test', { asyncStorage: mockAsyncStorage })
      ]);

      expect(() => rnPersistStore.set(circularObj)).not.toThrow();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should successfully persist with circular references replaced
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('rn-circular-test', '{"name":"test","self":"[Circular]"}');
    });

    it('should handle very large objects', async () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({ // Reduced size for tests
          id: i,
          name: `Item ${i}`,
          data: `${'x'.repeat(10)}`, // Smaller data per item
          metadata: {
            index: i,
            even: i % 2 === 0,
            tags: [`tag-${i % 10}`, `category-${i % 5}`],
          },
        })),
      };

      // Test persist plugin
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      mockLocalStorage.setItem.mockReturnValueOnce(undefined);
      const persistStore = store({}, [persist('large-test')]);
      
      const start1 = performance.now();
      persistStore.set(largeObject);
      const end1 = performance.now();
      
      expect(end1 - start1).toBeLessThan(100); // Should be fast
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('large-test', JSON.stringify(largeObject));

      // Test rnPersist plugin
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);
      const rnPersistStore = store({}, [
        rnPersist('rn-large-test', { asyncStorage: mockAsyncStorage })
      ]);

      const start2 = performance.now();
      rnPersistStore.set(largeObject);
      const end2 = performance.now();
      
      expect(end2 - start2).toBeLessThan(100); // Should be fast (sync part)
      
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('rn-large-test', JSON.stringify(largeObject));
    });

    it('should handle empty values consistently', async () => {
      const emptyValues = [
        {},
        [],
        '',
        0,
        false,
        null,
      ];

      for (let i = 0; i < emptyValues.length; i++) {
        const value = emptyValues[i];
        
        // Test persist plugin
        mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(value));
        const persistStore = store('default', [persist(`empty-${i}`)]);
        expect(persistStore.get()).toEqual(value);

        // Test rnPersist plugin
        mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(value));
        const rnPersistStore = store('default', [
          rnPersist(`rn-empty-${i}`, { asyncStorage: mockAsyncStorage })
        ]);

        await new Promise(resolve => setTimeout(resolve, 10));
        expect(rnPersistStore.get()).toEqual(value);
      }
    });
  });

  describe('Type Consistency', () => {
    it('should maintain type consistency across persistence', async () => {
      interface User {
        id: number;
        name: string;
        active: boolean;
        profile: {
          email: string;
          preferences: {
            theme: 'light' | 'dark';
            notifications: boolean;
          };
        };
        tags: string[];
      }

      const userData: User = {
        id: 1,
        name: 'John Doe',
        active: true,
        profile: {
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        tags: ['admin', 'user'],
      };

      // Test persist plugin with TypeScript
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(userData));
      const persistStore = store<User>({} as User, [persist('user-typed')]);
      
      const persistResult = persistStore.get();
      expect(persistResult).toEqual(userData);
      expect(typeof persistResult.id).toBe('number');
      expect(typeof persistResult.name).toBe('string');
      expect(typeof persistResult.active).toBe('boolean');
      expect(Array.isArray(persistResult.tags)).toBe(true);

      // Test rnPersist plugin with TypeScript
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));
      const rnPersistStore = store<User>({} as User, [
        rnPersist('rn-user-typed', { asyncStorage: mockAsyncStorage })
      ]);

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const rnPersistResult = rnPersistStore.get();
      expect(rnPersistResult).toEqual(userData);
      expect(typeof rnPersistResult.id).toBe('number');
      expect(typeof rnPersistResult.name).toBe('string');
      expect(typeof rnPersistResult.active).toBe('boolean');
      expect(Array.isArray(rnPersistResult.tags)).toBe(true);
    });
  });
});