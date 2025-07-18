import { store } from '../../src/core/store';
import { computed } from '../../src/plugins/computed';

describe('Computed Plugin', () => {
  describe('Basic Computed Values', () => {
    it('should add computed method to store', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      
      expect(typeof testStore.computed).toBe('function');
      expect(testStore.computed()).toBe(10);
    });

    it('should compute initial value', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      
      expect(testStore.computed()).toBe(10);
    });

    it('should update computed value when store changes', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      
      expect(testStore.computed()).toBe(10);
      
      testStore.set(10);
      expect(testStore.computed()).toBe(20);
      
      testStore.set(3);
      expect(testStore.computed()).toBe(6);
    });

    it('should work with function updates', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      
      testStore.set((prev: number) => prev + 1);
      expect(testStore.computed()).toBe(12); // (5 + 1) * 2
    });
  });

  describe('String Computations', () => {
    it('should compute string transformations', () => {
      const testStore = store('hello', [computed(s => s.toUpperCase())]) as any;
      
      expect(testStore.computed()).toBe('HELLO');
      
      testStore.set('world');
      expect(testStore.computed()).toBe('WORLD');
    });

    it('should compute string concatenations', () => {
      const testStore = store('hello', [computed(s => s + ' world')]) as any;
      
      expect(testStore.computed()).toBe('hello world');
      
      testStore.set('goodbye');
      expect(testStore.computed()).toBe('goodbye world');
    });

    it('should compute string lengths', () => {
      const testStore = store('hello', [computed(s => s.length)]) as any;
      
      expect(testStore.computed()).toBe(5);
      
      testStore.set('hello world');
      expect(testStore.computed()).toBe(11);
    });
  });

  describe('Object Computations', () => {
    it('should compute object properties', () => {
      interface User {
        firstName: string;
        lastName: string;
      }
      
      const testStore = store<User>(
        { firstName: 'John', lastName: 'Doe' },
        [computed(user => `${user.firstName} ${user.lastName}`)]
      ) as any;
      
      expect(testStore.computed()).toBe('John Doe');
      
      testStore.set({ firstName: 'Jane', lastName: 'Smith' });
      expect(testStore.computed()).toBe('Jane Smith');
    });

    it('should compute nested object properties', () => {
      interface User {
        name: string;
        address: {
          street: string;
          city: string;
        };
      }
      
      const testStore = store<User>(
        {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'New York'
          }
        },
        [computed(user => `${user.name} lives in ${user.address.city}`)]
      ) as any;
      
      expect(testStore.computed()).toBe('John lives in New York');
      
      testStore.set({
        name: 'Jane',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles'
        }
      });
      expect(testStore.computed()).toBe('Jane lives in Los Angeles');
    });

    it('should compute object transformations', () => {
      interface Counter {
        count: number;
        label: string;
      }
      
      const testStore = store<Counter>(
        { count: 5, label: 'Counter' },
        [computed(state => ({
          ...state,
          displayText: `${state.label}: ${state.count}`
        }))]
      ) as any;
      
      expect(testStore.computed()).toEqual({
        count: 5,
        label: 'Counter',
        displayText: 'Counter: 5'
      });
      
      testStore.set({ count: 10, label: 'Items' });
      expect(testStore.computed()).toEqual({
        count: 10,
        label: 'Items',
        displayText: 'Items: 10'
      });
    });
  });

  describe('Array Computations', () => {
    it('should compute array lengths', () => {
      const testStore = store([1, 2, 3], [computed(arr => arr.length)]) as any;
      
      expect(testStore.computed()).toBe(3);
      
      testStore.set([1, 2, 3, 4, 5]);
      expect(testStore.computed()).toBe(5);
    });

    it('should compute array sums', () => {
      const testStore = store([1, 2, 3], [computed(arr => arr.reduce((sum, n) => sum + n, 0))]) as any;
      
      expect(testStore.computed()).toBe(6);
      
      testStore.set([10, 20, 30]);
      expect(testStore.computed()).toBe(60);
    });

    it('should compute filtered arrays', () => {
      const testStore = store([1, 2, 3, 4, 5], [computed(arr => arr.filter(n => n % 2 === 0))]) as any;
      
      expect(testStore.computed()).toEqual([2, 4]);
      
      testStore.set([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(testStore.computed()).toEqual([2, 4, 6, 8]);
    });

    it('should compute array of objects', () => {
      interface Item {
        id: number;
        name: string;
        price: number;
      }
      
      const testStore = store<Item[]>(
        [
          { id: 1, name: 'Item 1', price: 10 },
          { id: 2, name: 'Item 2', price: 20 }
        ],
        [computed(items => items.reduce((total, item) => total + item.price, 0))]
      ) as any;
      
      expect(testStore.computed()).toBe(30);
      
      testStore.set([
        { id: 1, name: 'Item 1', price: 15 },
        { id: 2, name: 'Item 2', price: 25 },
        { id: 3, name: 'Item 3', price: 10 }
      ]);
      expect(testStore.computed()).toBe(50);
    });
  });

  describe('Complex Computations', () => {
    it('should handle complex mathematical computations', () => {
      interface Stats {
        values: number[];
      }
      
      const testStore = store<Stats>(
        { values: [1, 2, 3, 4, 5] },
        [computed(stats => {
          const sum = stats.values.reduce((a, b) => a + b, 0);
          const mean = sum / stats.values.length;
          const variance = stats.values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / stats.values.length;
          return {
            sum,
            mean,
            variance,
            stdDev: Math.sqrt(variance)
          };
        })]
      ) as any;
      
      const result = testStore.computed();
      expect(result.sum).toBe(15);
      expect(result.mean).toBe(3);
      expect(result.variance).toBe(2);
      expect(result.stdDev).toBeCloseTo(1.414, 3);
    });

    it('should handle conditional computations', () => {
      interface User {
        name: string;
        age: number;
        isActive: boolean;
      }
      
      const testStore = store<User>(
        { name: 'John', age: 25, isActive: true },
        [computed(user => {
          if (!user.isActive) {
            return 'Inactive User';
          }
          
          if (user.age < 18) {
            return `${user.name} (Minor)`;
          } else if (user.age >= 65) {
            return `${user.name} (Senior)`;
          } else {
            return `${user.name} (Adult)`;
          }
        })]
      ) as any;
      
      expect(testStore.computed()).toBe('John (Adult)');
      
      testStore.set({ name: 'Jane', age: 16, isActive: true });
      expect(testStore.computed()).toBe('Jane (Minor)');
      
      testStore.set({ name: 'Bob', age: 70, isActive: true });
      expect(testStore.computed()).toBe('Bob (Senior)');
      
      testStore.set({ name: 'Alice', age: 30, isActive: false });
      expect(testStore.computed()).toBe('Inactive User');
    });
  });

  describe('Performance', () => {
    it('should compute efficiently with frequent updates', () => {
      const testStore = store(0, [computed(x => x * 2)]) as any;
      
      const start = performance.now();
      
      for (let i = 1; i <= 1000; i++) {
        testStore.set(i);
        testStore.computed();
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
      expect(testStore.computed()).toBe(2000);
    });

    it('should handle complex computations efficiently', () => {
      const testStore = store(
        Array.from({ length: 1000 }, (_, i) => i),
        [computed(arr => arr.reduce((sum, n) => sum + n, 0))]
      ) as any;
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        testStore.set(Array.from({ length: 1000 }, (_, j) => j + i));
        testStore.computed();
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const testStore = store<string | null>('hello', [computed(s => s ? s.toUpperCase() : 'NULL')]) as any;
      
      expect(testStore.computed()).toBe('HELLO');
      
      testStore.set(null);
      expect(testStore.computed()).toBe('NULL');
    });

    it('should handle undefined values', () => {
      const testStore = store<string | undefined>('hello', [computed(s => s ? s.toUpperCase() : 'UNDEFINED')]) as any;
      
      expect(testStore.computed()).toBe('HELLO');
      
      testStore.set(undefined);
      expect(testStore.computed()).toBe('UNDEFINED');
    });

    it('should handle empty arrays', () => {
      const testStore = store<number[]>([], [computed(arr => arr.length > 0 ? arr.reduce((sum, n) => sum + n, 0) : 0)]) as any;
      
      expect(testStore.computed()).toBe(0);
      
      testStore.set([1, 2, 3]);
      expect(testStore.computed()).toBe(6);
      
      testStore.set([]);
      expect(testStore.computed()).toBe(0);
    });

    it('should handle empty objects', () => {
      const testStore = store<Record<string, number>>({}, [computed(obj => Object.keys(obj).length)]) as any;
      
      expect(testStore.computed()).toBe(0);
      
      testStore.set({ a: 1, b: 2 });
      expect(testStore.computed()).toBe(2);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with primitives', () => {
      const testStore = store<number>(5, [computed(x => x.toString())]) as any;
      
      expect(typeof testStore.computed()).toBe('string');
      expect(testStore.computed()).toBe('5');
    });

    it('should maintain type safety with complex types', () => {
      interface User {
        id: number;
        name: string;
      }
      
      interface UserWithDisplayName extends User {
        displayName: string;
      }
      
      const testStore = store<User>(
        { id: 1, name: 'John' },
        [computed((user: User): UserWithDisplayName => ({
          ...user,
          displayName: `User: ${user.name}`
        }))]
      ) as any;
      
      const computedResult = testStore.computed();
      expect(computedResult.id).toBe(1);
      expect(computedResult.name).toBe('John');
      expect(computedResult.displayName).toBe('User: John');
    });
  });

  describe('Integration with Store', () => {
    it('should not affect store get/set behavior', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      
      expect(testStore.get()).toBe(5);
      
      testStore.set(10);
      expect(testStore.get()).toBe(10);
      
      testStore.set((prev: number) => prev + 1);
      expect(testStore.get()).toBe(11);
    });

    it('should work with subscriptions', () => {
      const testStore = store(5, [computed(x => x * 2)]) as any;
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(10);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(testStore.computed()).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in compute function', () => {
      const testStore = store<string>('hello', [computed(s => {
        if (s === 'error') {
          throw new Error('Computation error');
        }
        return s.toUpperCase();
      })]) as any;
      
      expect(testStore.computed()).toBe('HELLO');
      
      expect(() => testStore.set('error')).toThrow('Computation error');
    });
  });
});