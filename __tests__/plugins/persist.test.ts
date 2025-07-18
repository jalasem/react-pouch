import { store } from '../../src/core/store';
import { persist } from '../../src/plugins/persist';

describe('Persist Plugin', () => {
  let mockLocalStorage: { [key: string]: string };
  let mockSessionStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    mockSessionStorage = {};

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockSessionStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });
  });

  describe('Basic Persistence', () => {
    it('should persist and restore values', () => {
      const testStore = store(0, [persist('test-key')]);
      
      testStore.set(42);
      expect(mockLocalStorage['test-key']).toBe('42');
      
      const newStore = store(0, [persist('test-key')]);
      expect(newStore.get()).toBe(42);
    });

    it('should work with complex objects', () => {
      const initialValue = { name: 'John', age: 30 };
      const testStore = store(initialValue, [persist('user-data')]);
      
      const updatedValue = { name: 'Jane', age: 25 };
      testStore.set(updatedValue);
      
      expect(mockLocalStorage['user-data']).toBe(JSON.stringify(updatedValue));
      
      const newStore = store({ name: '', age: 0 }, [persist('user-data')]);
      expect(newStore.get()).toEqual(updatedValue);
    });

    it('should work with arrays', () => {
      const initialValue = [1, 2, 3];
      const testStore = store(initialValue, [persist('array-data')]);
      
      testStore.set([4, 5, 6]);
      
      const newStore = store<number[]>([], [persist('array-data')]);
      expect(newStore.get()).toEqual([4, 5, 6]);
    });
  });

  describe('Storage Options', () => {
    it('should use localStorage by default', () => {
      const testStore = store(42, [persist('test-key')]);
      testStore.set(100);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', '100');
    });

    it('should use sessionStorage when specified', () => {
      const testStore = store(42, [
        persist('test-key', { storage: 'sessionStorage' })
      ]);
      testStore.set(100);
      
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('test-key', '100');
    });

    it('should restore from sessionStorage', () => {
      mockSessionStorage['test-key'] = '42';
      
      const testStore = store(0, [
        persist('test-key', { storage: 'sessionStorage' })
      ]);
      
      expect(testStore.get()).toBe(42);
    });
  });

  describe('Custom Serialization', () => {
    it('should use custom serialize function', () => {
      const customSerialize = (value: any) => `custom:${JSON.stringify(value)}`;
      const testStore = store(42, [
        persist('test-key', { serialize: customSerialize })
      ]);
      
      testStore.set(100);
      expect(mockLocalStorage['test-key']).toBe('custom:100');
    });

    it('should use custom deserialize function', () => {
      const customDeserialize = (value: string) => {
        const data = value.replace('custom:', '');
        return JSON.parse(data);
      };
      
      mockLocalStorage['test-key'] = 'custom:42';
      
      const testStore = store(0, [
        persist('test-key', { deserialize: customDeserialize })
      ]);
      
      expect(testStore.get()).toBe(42);
    });

    it('should handle Map serialization', () => {
      const mapSerializer = (value: Map<string, number>) => 
        JSON.stringify(Array.from(value.entries()));
      
      const mapDeserializer = (value: string) => 
        new Map(JSON.parse(value));
      
      const testStore = store(new Map([['key1', 1]]), [
        persist('map-data', {
          serialize: mapSerializer,
          deserialize: mapDeserializer
        })
      ]);
      
      testStore.set(new Map([['key2', 2]]));
      
      const newStore = store(new Map(), [
        persist('map-data', {
          serialize: mapSerializer,
          deserialize: mapDeserializer
        })
      ]);
      
      expect(newStore.get().get('key2')).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => {
            throw new Error('Storage error');
          }),
          setItem: jest.fn(() => {
            throw new Error('Storage error');
          }),
        },
        writable: true,
      });
      
      const testStore = store(42, [persist('test-key')]);
      expect(testStore.get()).toBe(42); // Should use initial value
      
      testStore.set(100);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save test-key to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle JSON parse errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage['test-key'] = 'invalid-json';
      
      const testStore = store(42, [persist('test-key')]);
      expect(testStore.get()).toBe(42); // Should use initial value
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load test-key from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle custom deserialize errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const errorDeserializer = () => {
        throw new Error('Custom deserialize error');
      };
      
      mockLocalStorage['test-key'] = 'some-data';
      
      const testStore = store(42, [
        persist('test-key', { deserialize: errorDeserializer })
      ]);
      
      expect(testStore.get()).toBe(42); // Should use initial value
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Server-side Rendering', () => {
    it('should work when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const testStore = store(42, [persist('test-key')]);
      expect(testStore.get()).toBe(42);
      
      testStore.set(100);
      expect(testStore.get()).toBe(100);
      
      global.window = originalWindow;
    });
  });

  describe('Multiple Stores', () => {
    it('should handle multiple stores with different keys', () => {
      const store1 = store(1, [persist('key1')]);
      const store2 = store(2, [persist('key2')]);
      
      store1.set(10);
      store2.set(20);
      
      expect(mockLocalStorage['key1']).toBe('10');
      expect(mockLocalStorage['key2']).toBe('20');
    });

    it('should handle multiple stores with same key', () => {
      const store1 = store(1, [persist('same-key')]);
      const store2 = store(2, [persist('same-key')]);
      
      store1.set(10);
      expect(store2.get()).toBe(2); // Should not affect existing store
      
      const newStore = store(0, [persist('same-key')]);
      expect(newStore.get()).toBe(10); // Should load from storage
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const testStore = store(null, [persist('null-key')]);
      testStore.set(null);
      
      const newStore = store('default', [persist('null-key')]);
      expect(newStore.get()).toBeNull();
    });

    it('should handle undefined values', () => {
      const testStore = store(undefined, [persist('undefined-key')]);
      testStore.set(undefined);
      
      // undefined cannot be serialized to JSON, so it becomes null
      const newStore = store('default', [persist('undefined-key')]);
      expect(newStore.get()).toBe('default'); // Should use default since undefined serializes to null
    });

    it('should handle empty strings', () => {
      const testStore = store('', [persist('empty-key')]);
      testStore.set('');
      
      const newStore = store('default', [persist('empty-key')]);
      expect(newStore.get()).toBe('');
    });

    it('should handle boolean values', () => {
      const testStore = store(true, [persist('bool-key')]);
      testStore.set(false);
      
      const newStore = store(true, [persist('bool-key')]);
      expect(newStore.get()).toBe(false);
    });
  });
});