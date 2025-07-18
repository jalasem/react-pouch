import { store, useStore } from '../../src/core/store';
import { Plugin } from '../../src/core/types';
import { renderHook, act } from '@testing-library/react';

describe('Store Core Functionality', () => {
  describe('Basic Store Operations', () => {
    it('should create a store with initial value', () => {
      const testStore = store(42);
      expect(testStore.get()).toBe(42);
    });

    it('should handle string values', () => {
      const testStore = store('hello');
      expect(testStore.get()).toBe('hello');
    });

    it('should handle boolean values', () => {
      const testStore = store(true);
      expect(testStore.get()).toBe(true);
    });

    it('should handle object values', () => {
      const initialValue = { name: 'John', age: 30 };
      const testStore = store(initialValue);
      expect(testStore.get()).toEqual(initialValue);
    });

    it('should handle array values', () => {
      const initialValue = [1, 2, 3];
      const testStore = store(initialValue);
      expect(testStore.get()).toEqual(initialValue);
    });

    it('should handle null values', () => {
      const testStore = store(null);
      expect(testStore.get()).toBeNull();
    });

    it('should handle undefined values', () => {
      const testStore = store(undefined);
      expect(testStore.get()).toBeUndefined();
    });
  });

  describe('Setting Values', () => {
    it('should set direct values', () => {
      const testStore = store(0);
      testStore.set(42);
      expect(testStore.get()).toBe(42);
    });

    it('should set values using function updater', () => {
      const testStore = store(0);
      testStore.set((current) => current + 1);
      expect(testStore.get()).toBe(1);
    });

    it('should handle complex object updates', () => {
      const testStore = store({ name: 'John', age: 30 });
      testStore.set((current) => ({ ...current, age: 31 }));
      expect(testStore.get()).toEqual({ name: 'John', age: 31 });
    });

    it('should handle array updates', () => {
      const testStore = store([1, 2, 3]);
      testStore.set((current) => [...current, 4]);
      expect(testStore.get()).toEqual([1, 2, 3, 4]);
    });

    it('should handle multiple consecutive updates', () => {
      const testStore = store(0);
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      expect(testStore.get()).toBe(3);
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on value change', () => {
      const testStore = store(0);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(1);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify on setting same value', () => {
      const testStore = store(0);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(0);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers', () => {
      const testStore = store(0);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      testStore.subscribe(listener1);
      testStore.subscribe(listener2);
      testStore.set(1);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe properly', () => {
      const testStore = store(0);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      testStore.set(1);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      testStore.set(2);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple unsubscribes safely', () => {
      const testStore = store(0);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      unsubscribe();
      unsubscribe(); // Should not throw
      
      testStore.set(1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('React Integration', () => {
    it('should work with useStore hook', () => {
      const testStore = store(0);
      const { result } = renderHook(() => useStore(testStore));
      
      expect(result.current).toBe(0);
    });

    it('should re-render when store value changes', () => {
      const testStore = store(0);
      const { result } = renderHook(() => useStore(testStore));
      
      act(() => {
        testStore.set(1);
      });
      
      expect(result.current).toBe(1);
    });

    it('should work with built-in use() method', () => {
      const testStore = store(0);
      const { result } = renderHook(() => testStore.use());
      
      expect(result.current).toBe(0);
      
      act(() => {
        testStore.set(1);
      });
      
      expect(result.current).toBe(1);
    });
  });

  describe('Plugin System', () => {
    it('should work without plugins', () => {
      const testStore = store(0);
      expect(testStore.get()).toBe(0);
    });

    it('should initialize with plugins', () => {
      const initializePlugin: Plugin<number> = {
        initialize: (value) => value + 1
      };
      
      const testStore = store(0, [initializePlugin]);
      expect(testStore.get()).toBe(1);
    });

    it('should call setup hooks', () => {
      const setupSpy = jest.fn();
      const setupPlugin: Plugin<number> = {
        setup: setupSpy
      };
      
      const testStore = store(0, [setupPlugin]);
      expect(setupSpy).toHaveBeenCalledWith(testStore);
    });

    it('should call onSet hooks', () => {
      const onSetSpy = jest.fn();
      const onSetPlugin: Plugin<number> = {
        onSet: onSetSpy
      };
      
      const testStore = store(0, [onSetPlugin]);
      testStore.set(1);
      
      expect(onSetSpy).toHaveBeenCalledWith(1, 0);
    });

    it('should allow plugins to transform values', () => {
      const doublePlugin: Plugin<number> = {
        onSet: (newValue) => newValue * 2
      };
      
      const testStore = store(0, [doublePlugin]);
      testStore.set(5);
      
      expect(testStore.get()).toBe(10);
    });

    it('should execute multiple plugins in order', () => {
      const addOnePlugin: Plugin<number> = {
        onSet: (newValue) => newValue + 1
      };
      
      const doublePlugin: Plugin<number> = {
        onSet: (newValue) => newValue * 2
      };
      
      const testStore = store(0, [addOnePlugin, doublePlugin]);
      testStore.set(5);
      
      // Should be (5 + 1) * 2 = 12
      expect(testStore.get()).toBe(12);
    });

    it('should handle plugins that return undefined', () => {
      const noopPlugin: Plugin<number> = {
        onSet: () => undefined
      };
      
      const testStore = store(0, [noopPlugin]);
      testStore.set(5);
      
      expect(testStore.get()).toBe(5);
    });

    it('should allow plugins to add methods to store', () => {
      interface StoreWithMethod {
        customMethod: () => string;
      }
      
      const methodPlugin: Plugin<number> = {
        setup: (store) => {
          (store as any).customMethod = () => 'custom';
        }
      };
      
      const testStore = store(0, [methodPlugin]) as any;
      expect(testStore.customMethod()).toBe('custom');
    });

    it('should handle empty plugin array', () => {
      const testStore = store(0, []);
      expect(testStore.get()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in plugin initialize', () => {
      const errorPlugin: Plugin<number> = {
        initialize: () => {
          throw new Error('Initialize error');
        }
      };
      
      expect(() => store(0, [errorPlugin])).toThrow('Initialize error');
    });

    it('should handle errors in plugin setup', () => {
      const errorPlugin: Plugin<number> = {
        setup: () => {
          throw new Error('Setup error');
        }
      };
      
      expect(() => store(0, [errorPlugin])).toThrow('Setup error');
    });

    it('should handle errors in plugin onSet', () => {
      const errorPlugin: Plugin<number> = {
        onSet: () => {
          throw new Error('OnSet error');
        }
      };
      
      const testStore = store(0, [errorPlugin]);
      expect(() => testStore.set(1)).toThrow('OnSet error');
    });

    it('should handle errors in listeners', () => {
      const testStore = store(0);
      const errorListener = () => {
        throw new Error('Listener error');
      };
      
      testStore.subscribe(errorListener);
      expect(() => testStore.set(1)).toThrow('Listener error');
    });
  });

  describe('Performance', () => {
    it('should handle large number of subscribers', () => {
      const testStore = store(0);
      const listeners = Array.from({ length: 1000 }, () => jest.fn());
      
      listeners.forEach(listener => testStore.subscribe(listener));
      
      const start = performance.now();
      testStore.set(1);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
      listeners.forEach(listener => expect(listener).toHaveBeenCalledTimes(1));
    });

    it('should handle rapid value changes', () => {
      const testStore = store(0);
      const listener = jest.fn();
      testStore.subscribe(listener);
      
      for (let i = 0; i < 1000; i++) {
        testStore.set(i);
      }
      
      expect(testStore.get()).toBe(999);
      expect(listener).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with primitive types', () => {
      const numberStore = store<number>(0);
      numberStore.set(42);
      expect(typeof numberStore.get()).toBe('number');
    });

    it('should maintain type safety with complex types', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      const userStore = store<User>({
        id: 1,
        name: 'John',
        email: 'john@example.com'
      });
      
      userStore.set({ id: 2, name: 'Jane', email: 'jane@example.com' });
      expect(userStore.get().name).toBe('Jane');
    });
  });

  describe('Memory Management', () => {
    it('should cleanup subscriptions properly', () => {
      const testStore = store(0);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      testStore.set(1);
      
      unsubscribe();
      testStore.set(2);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not leak memory with multiple subscribe/unsubscribe cycles', () => {
      const testStore = store(0);
      
      for (let i = 0; i < 100; i++) {
        const listener = jest.fn();
        const unsubscribe = testStore.subscribe(listener);
        unsubscribe();
      }
      
      testStore.set(1);
      // Should not crash or have memory issues
    });
  });
});