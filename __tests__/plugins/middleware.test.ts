import { store } from '../../src/core/store';
import { middleware } from '../../src/plugins/middleware';

describe('Middleware Plugin', () => {
  describe('Single Middleware', () => {
    it('should apply middleware to store updates', () => {
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      
      const testStore = store('hello', [middleware(upperCaseMiddleware)]);
      
      testStore.set('world');
      
      expect(testStore.get()).toBe('WORLD');
    });

    it('should apply middleware to function-based updates', () => {
      const doubleMiddleware = (value: number) => value * 2;
      
      const testStore = store(5, [middleware(doubleMiddleware)]);
      
      testStore.set(prev => prev + 1);
      
      expect(testStore.get()).toBe(12); // (5 + 1) * 2
    });

    it('should pass both new and old values to middleware', () => {
      const middleware1 = jest.fn((newValue: string, oldValue: string) => {
        return `${oldValue} -> ${newValue}`;
      });
      
      const testStore = store('initial', [middleware(middleware1)]);
      
      testStore.set('updated');
      
      expect(middleware1).toHaveBeenCalledWith('updated', 'initial');
      expect(testStore.get()).toBe('initial -> updated');
    });

    it('should work with object transformations', () => {
      const addTimestampMiddleware = (value: { data: string }, oldValue: { data: string }) => ({
        ...value,
        timestamp: Date.now(),
        version: (oldValue as any).version ? (oldValue as any).version + 1 : 1
      });
      
      const testStore = store({ data: 'test' } as any, [middleware(addTimestampMiddleware)]);
      
      testStore.set({ data: 'updated' } as any);
      
      const result = testStore.get();
      expect(result.data).toBe('updated');
      expect(result.timestamp).toBeDefined();
      expect((result as any).version).toBe(1);
    });

    it('should work with array transformations', () => {
      const sortMiddleware = (value: number[]) => [...value].sort((a, b) => a - b);
      
      const testStore = store([3, 1, 4, 1, 5], [middleware(sortMiddleware)]);
      
      testStore.set([9, 2, 6, 5, 3]);
      
      expect(testStore.get()).toEqual([2, 3, 5, 6, 9]);
    });
  });

  describe('Multiple Middleware', () => {
    it('should apply multiple middleware in order', () => {
      const addPrefixMiddleware = (value: string) => `prefix_${value}`;
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      const addSuffixMiddleware = (value: string) => `${value}_suffix`;
      
      const testStore = store('test', [
        middleware(addPrefixMiddleware, upperCaseMiddleware, addSuffixMiddleware)
      ]);
      
      testStore.set('hello');
      
      expect(testStore.get()).toBe('PREFIX_HELLO_suffix');
    });

    it('should chain transformations correctly', () => {
      const multiplyByTwo = (value: number) => value * 2;
      const addTen = (value: number) => value + 10;
      const toString = (value: number) => value.toString();
      
      const testStore = store(5, [
        middleware(multiplyByTwo, addTen, toString as any)
      ]);
      
      testStore.set(3);
      
      expect(testStore.get()).toBe('16'); // (3 * 2) + 10 = 16, then toString()
    });

    it('should handle empty middleware array', () => {
      const testStore = store('test', [middleware()]);
      
      testStore.set('updated');
      
      expect(testStore.get()).toBe('updated');
    });

    it('should pass correct old value to each middleware', () => {
      const middleware1 = jest.fn((newValue: string, oldValue: string) => `${newValue}_1`);
      const middleware2 = jest.fn((newValue: string, oldValue: string) => `${newValue}_2`);
      
      const testStore = store('initial', [middleware(middleware1, middleware2)]);
      
      testStore.set('test');
      
      expect(middleware1).toHaveBeenCalledWith('test', 'initial');
      expect(middleware2).toHaveBeenCalledWith('test_1', 'initial');
      expect(testStore.get()).toBe('test_1_2');
    });

    it('should handle complex object transformations', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const validateAge = (user: User) => ({
        ...user,
        age: Math.max(0, Math.min(150, user.age))
      });
      
      const addMetadata = (user: User) => ({
        ...user,
        id: Math.random(),
        createdAt: new Date().toISOString()
      });
      
      const testStore = store<User>({ name: 'John', age: 25 }, [
        middleware(validateAge, addMetadata)
      ]);
      
      testStore.set({ name: 'Jane', age: 200 });
      
      const result = testStore.get();
      expect(result.name).toBe('Jane');
      expect(result.age).toBe(150); // Clamped to max
      expect((result as any).id).toBeDefined();
      expect((result as any).createdAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle middleware errors gracefully', () => {
      const errorMiddleware = (value: string) => {
        throw new Error('Middleware error');
      };
      
      const testStore = store('test', [middleware(errorMiddleware)]);
      
      expect(() => testStore.set('updated')).toThrow('Middleware error');
    });

    it('should handle errors in one middleware without affecting others', () => {
      const workingMiddleware = (value: string) => `working_${value}`;
      const errorMiddleware = (value: string) => {
        throw new Error('Middleware error');
      };
      
      const testStore = store('test', [middleware(workingMiddleware, errorMiddleware)]);
      
      expect(() => testStore.set('updated')).toThrow('Middleware error');
    });

    it('should handle null return values', () => {
      const nullMiddleware = (value: string) => null as any;
      
      const testStore = store('test', [middleware(nullMiddleware)]);
      
      testStore.set('updated');
      
      expect(testStore.get()).toBeNull();
    });

    it('should handle undefined return values', () => {
      const undefinedMiddleware = (value: string) => undefined as any;
      
      const testStore = store('test', [middleware(undefinedMiddleware)]);
      
      testStore.set('updated');
      
      expect(testStore.get()).toBeUndefined();
    });
  });

  describe('Integration with Store', () => {
    it('should work with store subscriptions', () => {
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      const testStore = store('test', [middleware(upperCaseMiddleware)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set('hello');
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(testStore.get()).toBe('HELLO');
    });

    it('should work with multiple plugins', () => {
      const mockPlugin = {
        onSet: jest.fn()
      };
      
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      
      const testStore = store('test', [
        mockPlugin,
        middleware(upperCaseMiddleware)
      ]);
      
      testStore.set('hello');
      
      expect(mockPlugin.onSet).toHaveBeenCalled();
      expect(testStore.get()).toBe('HELLO');
    });

    it('should not interfere with direct store.get()', () => {
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      const testStore = store('test', [middleware(upperCaseMiddleware)]);
      
      // get() should work normally
      expect(testStore.get()).toBe('test');
      
      // set() should apply middleware
      testStore.set('hello');
      expect(testStore.get()).toBe('HELLO');
    });

    it('should preserve original set method behavior for function calls', () => {
      const addOneMiddleware = (value: number) => value + 1;
      const testStore = store(5, [middleware(addOneMiddleware)]);
      
      testStore.set(prev => prev * 2);
      
      expect(testStore.get()).toBe(11); // (5 * 2) + 1
    });
  });

  describe('Performance', () => {
    it('should handle frequent updates efficiently', () => {
      const simpleMiddleware = (value: number) => value + 1;
      const testStore = store(0, [middleware(simpleMiddleware)]);
      
      const start = performance.now();
      
      for (let i = 1; i <= 1000; i++) {
        testStore.set(i);
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete quickly
      expect(testStore.get()).toBe(1001); // 1000 + 1
    });

    it('should handle complex middleware chains efficiently', () => {
      const middleware1 = (value: string) => value.toUpperCase();
      const middleware2 = (value: string) => value.replace(/\s+/g, '_');
      const middleware3 = (value: string) => `processed_${value}`;
      
      const testStore = store('test', [middleware(middleware1, middleware2, middleware3)]);
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        testStore.set(`test value ${i}`);
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Should handle complex chains efficiently
      expect(testStore.get()).toBe('processed_TEST_VALUE_99');
    });

    it('should handle large object transformations efficiently', () => {
      const largeObject = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item_${i}` }))
      };
      
      const addMetadataMiddleware = (obj: any) => ({
        ...obj,
        processed: true,
        timestamp: Date.now()
      });
      
      const testStore = store(largeObject, [middleware(addMetadataMiddleware)]);
      
      const start = performance.now();
      testStore.set({ ...largeObject, updated: true });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Should handle large objects efficiently
      expect((testStore.get() as any).processed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const nullHandlingMiddleware = (value: string | null) => 
        value === null ? 'was_null' : value;
      
      const testStore = store<string | null>('test', [middleware(nullHandlingMiddleware as any)]);
      
      testStore.set(null);
      
      expect(testStore.get()).toBe('was_null');
    });

    it('should handle undefined values', () => {
      const undefinedHandlingMiddleware = (value: string | undefined) => 
        value === undefined ? 'was_undefined' : value;
      
      const testStore = store<string | undefined>('test', [middleware(undefinedHandlingMiddleware as any)]);
      
      testStore.set(undefined);
      
      expect(testStore.get()).toBe('was_undefined');
    });

    it('should handle empty strings', () => {
      const emptyStringMiddleware = (value: string) => 
        value === '' ? 'empty_string' : value;
      
      const testStore = store('test', [middleware(emptyStringMiddleware)]);
      
      testStore.set('');
      
      expect(testStore.get()).toBe('empty_string');
    });

    it('should handle empty arrays', () => {
      const emptyArrayMiddleware = (value: number[]) => 
        value.length === 0 ? [0] : value;
      
      const testStore = store([1, 2, 3], [middleware(emptyArrayMiddleware)]);
      
      testStore.set([]);
      
      expect(testStore.get()).toEqual([0]);
    });

    it('should handle empty objects', () => {
      const emptyObjectMiddleware = (value: Record<string, any>) => 
        Object.keys(value).length === 0 ? { empty: true } : value;
      
      const testStore = store({ test: 'value' }, [middleware(emptyObjectMiddleware)]);
      
      testStore.set({});
      
      expect(testStore.get()).toEqual({ empty: true });
    });

    it('should handle same value updates', () => {
      const sameValueMiddleware = jest.fn((value: string) => value);
      
      const testStore = store('test', [middleware(sameValueMiddleware)]);
      
      testStore.set('test');
      
      expect(sameValueMiddleware).toHaveBeenCalledWith('test', 'test');
      expect(testStore.get()).toBe('test');
    });

    it('should handle circular references in middleware', () => {
      const addCircularMiddleware = (value: any) => {
        const result = { ...value, circular: {} };
        result.circular = result; // Create circular reference
        return result;
      };
      
      const testStore = store({ data: 'test' }, [middleware(addCircularMiddleware)]);
      
      testStore.set({ data: 'updated' });
      
      const result = testStore.get();
      expect(result.data).toBe('updated');
      expect(result.circular).toBe(result); // Should maintain circular reference
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with same type transformations', () => {
      const stringMiddleware = (value: string) => value.toUpperCase();
      
      const testStore = store<string>('test', [middleware(stringMiddleware)]);
      
      testStore.set('hello');
      
      expect(typeof testStore.get()).toBe('string');
      expect(testStore.get()).toBe('HELLO');
    });

    it('should work with type transformations', () => {
      const numberToStringMiddleware = (value: number) => value.toString();
      
      const testStore = store<number>(42, [middleware(numberToStringMiddleware as any)]);
      
      testStore.set(100);
      
      expect(typeof testStore.get()).toBe('string');
      expect(testStore.get()).toBe('100');
    });

    it('should work with complex type transformations', () => {
      interface User {
        id: number;
        name: string;
      }
      
      interface ExtendedUser extends User {
        displayName: string;
      }
      
      const extendUserMiddleware = (user: User): ExtendedUser => ({
        ...user,
        displayName: `User: ${user.name}`
      });
      
      const testStore = store<User>({ id: 1, name: 'John' }, [middleware(extendUserMiddleware as any)]);
      
      testStore.set({ id: 2, name: 'Jane' });
      
      const result = testStore.get();
      expect(result.id).toBe(2);
      expect(result.name).toBe('Jane');
      expect((result as any).displayName).toBe('User: Jane');
    });
  });

  describe('Functional Programming Patterns', () => {
    it('should work with curried middleware', () => {
      const createPrefixMiddleware = (prefix: string) => (value: string) => `${prefix}_${value}`;
      const createSuffixMiddleware = (suffix: string) => (value: string) => `${value}_${suffix}`;
      
      const testStore = store('test', [
        middleware(
          createPrefixMiddleware('pre'),
          createSuffixMiddleware('post')
        )
      ]);
      
      testStore.set('hello');
      
      expect(testStore.get()).toBe('pre_hello_post');
    });

    it('should work with higher-order middleware', () => {
      const withLogging = (middleware: (value: string) => string) => (value: string) => {
        console.log(`Processing: ${value}`);
        return middleware(value);
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const upperCaseMiddleware = (value: string) => value.toUpperCase();
      const loggedMiddleware = withLogging(upperCaseMiddleware);
      
      const testStore = store('test', [middleware(loggedMiddleware)]);
      
      testStore.set('hello');
      
      expect(consoleSpy).toHaveBeenCalledWith('Processing: hello');
      expect(testStore.get()).toBe('HELLO');
      
      consoleSpy.mockRestore();
    });

    it('should work with conditional middleware', () => {
      const conditionalMiddleware = (value: number) => 
        value > 10 ? value * 2 : value;
      
      const testStore = store(5, [middleware(conditionalMiddleware)]);
      
      // Value <= 10, should not be modified
      testStore.set(8);
      expect(testStore.get()).toBe(8);
      
      // Value > 10, should be doubled
      testStore.set(15);
      expect(testStore.get()).toBe(30);
    });

    it('should support middleware composition', () => {
      const compose = (...middlewares: Array<(value: any) => any>) => 
        (value: any) => middlewares.reduce((acc, mw) => mw(acc), value);
      
      const addOne = (value: number) => value + 1;
      const double = (value: number) => value * 2;
      const toString = (value: number) => value.toString();
      
      const composedMiddleware = compose(addOne, double, toString);
      
      const testStore = store(5, [middleware(composedMiddleware)]);
      
      testStore.set(3);
      
      expect(testStore.get()).toBe('8'); // (3 + 1) * 2 = 8, then toString()
    });
  });
});