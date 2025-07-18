import { store } from '../../src/core/store';
import { sync } from '../../src/plugins/sync';

describe('Sync Plugin', () => {
  let fetchMock: jest.Mock;
  let originalWindow: any;
  let originalFetch: any;

  beforeEach(() => {
    fetchMock = jest.fn();
    originalFetch = global.fetch;
    originalWindow = global.window;
    
    global.fetch = fetchMock;
    // Ensure window is defined for tests
    if (typeof global.window === 'undefined') {
      global.window = {} as any;
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.window = originalWindow;
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create sync plugin without errors', () => {
      expect(() => sync('https://api.example.com/data')).not.toThrow();
    });

    it('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      const mockErrorHandler = jest.fn();
      delete (global as any).window;
      
      expect(() => {
        const syncPlugin = sync('https://api.example.com/data', {
          onError: mockErrorHandler
        });
        const mockPouch = {
          get: jest.fn(),
          set: jest.fn(),
          subscribe: jest.fn(),
          use: jest.fn(),
        };

        if (syncPlugin.setup) {
          syncPlugin.setup(mockPouch);
        }
        
        if (syncPlugin.onSet) {
          syncPlugin.onSet({ test: 'data' }, { old: 'data' });
        }
      }).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });

    it('should handle missing fetch gracefully', () => {
      delete (global as any).fetch;
      
      const syncPlugin = sync('https://api.example.com/data');
      const mockPouch = {
        get: jest.fn(),
        set: jest.fn(),
        subscribe: jest.fn(),
        use: jest.fn(),
      };

      expect(() => {
        if (syncPlugin.setup) {
          syncPlugin.setup(mockPouch);
        }
      }).not.toThrow();
      
      expect(() => {
        if (syncPlugin.onSet) {
          syncPlugin.onSet({ test: 'data' }, { old: 'data' });
        }
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should accept custom debounce time', () => {
      const syncPlugin = sync('https://api.example.com/data', { debounce: 1000 });
      expect(syncPlugin).toBeDefined();
      expect(typeof syncPlugin.onSet).toBe('function');
    });

    it('should accept custom error handler', () => {
      const customErrorHandler = jest.fn();
      const syncPlugin = sync('https://api.example.com/data', { 
        onError: customErrorHandler 
      });
      expect(syncPlugin).toBeDefined();
    });

    it('should accept custom headers', () => {
      const syncPlugin = sync('https://api.example.com/data', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value'
        }
      });
      expect(syncPlugin).toBeDefined();
    });

    it('should accept custom fetch options', () => {
      const syncPlugin = sync('https://api.example.com/data', {
        credentials: 'include',
        mode: 'cors'
      });
      expect(syncPlugin).toBeDefined();
    });
  });

  describe('Plugin Interface', () => {
    it('should have setup method', () => {
      const syncPlugin = sync('https://api.example.com/data');
      expect(typeof syncPlugin.setup).toBe('function');
    });

    it('should have onSet method', () => {
      const syncPlugin = sync('https://api.example.com/data');
      expect(typeof syncPlugin.onSet).toBe('function');
    });

    it('should not have initialize method', () => {
      const syncPlugin = sync('https://api.example.com/data');
      expect(syncPlugin.initialize).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should work with different data types', () => {
      expect(() => {
        const stringSync = sync<string>('https://api.example.com/data');
        const numberSync = sync<number>('https://api.example.com/data');
        const objectSync = sync<{ id: number; name: string }>('https://api.example.com/data');
        const arraySync = sync<string[]>('https://api.example.com/data');
        
        // All should be valid
        expect(stringSync).toBeDefined();
        expect(numberSync).toBeDefined();
        expect(objectSync).toBeDefined();
        expect(arraySync).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Integration with Store', () => {
    it('should integrate with store without errors', () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ data: 'test' })
      });

      expect(() => {
        const testStore = store({}, [sync('https://api.example.com/data')]);
        expect(testStore).toBeDefined();
        expect(typeof testStore.get).toBe('function');
        expect(typeof testStore.set).toBe('function');
      }).not.toThrow();
    });

    it('should work with multiple sync plugins', () => {
      fetchMock.mockResolvedValue({
        json: () => Promise.resolve({ data: 'test' })
      });

      expect(() => {
        const testStore = store({}, [
          sync('https://api.example.com/data1'),
          sync('https://api.example.com/data2')
        ]);
        expect(testStore).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const syncPlugin = sync('https://api.example.com/data');
      const mockPouch = {
        get: jest.fn(),
        set: jest.fn(),
        subscribe: jest.fn(),
        use: jest.fn(),
      };

      expect(() => {
        if (syncPlugin.onSet) {
          syncPlugin.onSet(null, undefined);
          syncPlugin.onSet(undefined, null);
        }
      }).not.toThrow();
    });

    it('should handle empty objects and arrays', () => {
      const syncPlugin = sync('https://api.example.com/data');
      const mockPouch = {
        get: jest.fn(),
        set: jest.fn(),
        subscribe: jest.fn(),
        use: jest.fn(),
      };

      expect(() => {
        if (syncPlugin.onSet) {
          syncPlugin.onSet({}, []);
          syncPlugin.onSet([], {});
        }
      }).not.toThrow();
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        user: {
          id: 1,
          name: 'John',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        settings: {
          language: 'en',
          timezone: 'UTC'
        }
      };

      const syncPlugin = sync('https://api.example.com/data');
      const mockPouch = {
        get: jest.fn(),
        set: jest.fn(),
        subscribe: jest.fn(),
        use: jest.fn(),
      };

      expect(() => {
        if (syncPlugin.onSet) {
          syncPlugin.onSet(complexObject, {});
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs', () => {
      expect(() => {
        const syncPlugin = sync('not-a-url');
        expect(syncPlugin).toBeDefined();
      }).not.toThrow();
    });

    it('should handle empty URL', () => {
      expect(() => {
        const syncPlugin = sync('');
        expect(syncPlugin).toBeDefined();
      }).not.toThrow();
    });

    it('should handle invalid options', () => {
      expect(() => {
        const syncPlugin = sync('https://api.example.com/data', {
          debounce: -1,
          onError: null as any,
          headers: null as any
        });
        expect(syncPlugin).toBeDefined();
      }).not.toThrow();
    });
  });
});