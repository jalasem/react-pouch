import { store } from '../../src/core/store';
import { history } from '../../src/plugins/history';

describe('History Plugin', () => {
  describe('Basic Undo/Redo', () => {
    it('should add undo/redo methods to store', () => {
      const testStore = store(0, [history()]) as any;
      
      expect(typeof testStore.undo).toBe('function');
      expect(typeof testStore.redo).toBe('function');
      expect(typeof testStore.canUndo).toBe('function');
      expect(typeof testStore.canRedo).toBe('function');
    });

    it('should track history on value changes', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      expect(testStore.get()).toBe(3);
      expect(testStore.canUndo()).toBe(true);
      expect(testStore.canRedo()).toBe(false);
    });

    it('should undo to previous values', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      testStore.undo();
      expect(testStore.get()).toBe(2);
      
      testStore.undo();
      expect(testStore.get()).toBe(1);
      
      testStore.undo();
      expect(testStore.get()).toBe(0);
    });

    it('should redo to next values', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      testStore.undo();
      testStore.undo();
      expect(testStore.get()).toBe(1);
      
      testStore.redo();
      expect(testStore.get()).toBe(2);
      
      testStore.redo();
      expect(testStore.get()).toBe(3);
    });

    it('should handle undo/redo boundaries', () => {
      const testStore = store(0, [history()]) as any;
      
      // Test undo boundary
      expect(testStore.canUndo()).toBe(false);
      testStore.undo(); // Should not crash
      expect(testStore.get()).toBe(0);
      
      testStore.set(1);
      expect(testStore.canUndo()).toBe(true);
      
      // Test redo boundary
      expect(testStore.canRedo()).toBe(false);
      testStore.redo(); // Should not crash
      expect(testStore.get()).toBe(1);
      
      testStore.undo();
      expect(testStore.canRedo()).toBe(true);
    });
  });

  describe('History Size Management', () => {
    it('should use default max size of 10', () => {
      const testStore = store(0, [history()]) as any;
      
      // Add 15 values
      for (let i = 1; i <= 15; i++) {
        testStore.set(i);
      }
      
      expect(testStore.get()).toBe(15);
      
      // Should only be able to undo 10 times
      let undoCount = 0;
      while (testStore.canUndo()) {
        testStore.undo();
        undoCount++;
      }
      
      expect(undoCount).toBe(10);
      expect(testStore.get()).toBe(5); // Should be at value 5
    });

    it('should respect custom max size', () => {
      const testStore = store(0, [history(5)]) as any;
      
      // Add 10 values
      for (let i = 1; i <= 10; i++) {
        testStore.set(i);
      }
      
      expect(testStore.get()).toBe(10);
      
      // Should only be able to undo 5 times
      let undoCount = 0;
      while (testStore.canUndo()) {
        testStore.undo();
        undoCount++;
      }
      
      expect(undoCount).toBe(5);
      expect(testStore.get()).toBe(5); // Should be at value 5
    });

    it('should handle size of 1', () => {
      const testStore = store(0, [history(1)]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      expect(testStore.canUndo()).toBe(true);
      testStore.undo();
      expect(testStore.get()).toBe(2);
      
      expect(testStore.canUndo()).toBe(false);
    });

    it('should handle size of 0', () => {
      const testStore = store(0, [history(0)]) as any;
      
      testStore.set(1);
      testStore.set(2);
      
      expect(testStore.canUndo()).toBe(false);
      expect(testStore.canRedo()).toBe(false);
    });
  });

  describe('History State Management', () => {
    it('should clear redo history on new changes', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      testStore.undo();
      testStore.undo();
      expect(testStore.get()).toBe(1);
      expect(testStore.canRedo()).toBe(true);
      
      testStore.set(4); // Should clear redo history
      expect(testStore.canRedo()).toBe(false);
      expect(testStore.get()).toBe(4);
    });

    it('should provide access to history state', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      expect(testStore.history.past).toEqual([0, 1, 2]);
      expect(testStore.history.future).toEqual([]);
      
      testStore.undo();
      testStore.undo();
      
      expect(testStore.history.past).toEqual([0]);
      expect(testStore.history.future).toEqual([2, 3]);
    });
  });

  describe('Complex Data Types', () => {
    it('should work with objects', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const testStore = store<User>({ name: 'John', age: 30 }, [history()]) as any;
      
      testStore.set({ name: 'Jane', age: 25 });
      testStore.set({ name: 'Bob', age: 35 });
      
      expect(testStore.get()).toEqual({ name: 'Bob', age: 35 });
      
      testStore.undo();
      expect(testStore.get()).toEqual({ name: 'Jane', age: 25 });
      
      testStore.undo();
      expect(testStore.get()).toEqual({ name: 'John', age: 30 });
    });

    it('should work with arrays', () => {
      const testStore = store<number[]>([1, 2, 3], [history()]) as any;
      
      testStore.set([4, 5, 6]);
      testStore.set([7, 8, 9]);
      
      expect(testStore.get()).toEqual([7, 8, 9]);
      
      testStore.undo();
      expect(testStore.get()).toEqual([4, 5, 6]);
      
      testStore.undo();
      expect(testStore.get()).toEqual([1, 2, 3]);
    });

    it('should work with nested objects', () => {
      interface NestedData {
        user: {
          name: string;
          details: {
            age: number;
            email: string;
          };
        };
      }
      
      const initial: NestedData = {
        user: {
          name: 'John',
          details: {
            age: 30,
            email: 'john@example.com'
          }
        }
      };
      
      const testStore = store(initial, [history()]) as any;
      
      testStore.set({
        user: {
          name: 'Jane',
          details: {
            age: 25,
            email: 'jane@example.com'
          }
        }
      });
      
      expect(testStore.get().user.name).toBe('Jane');
      
      testStore.undo();
      expect(testStore.get().user.name).toBe('John');
    });
  });

  describe('Function Updates', () => {
    it('should work with function updates', () => {
      const testStore = store(0, [history()]) as any;
      
      testStore.set((prev: number) => prev + 1);
      testStore.set((prev: number) => prev * 2);
      testStore.set((prev: number) => prev + 5);
      
      expect(testStore.get()).toBe(7); // ((0 + 1) * 2) + 5
      
      testStore.undo();
      expect(testStore.get()).toBe(2); // (0 + 1) * 2
      
      testStore.undo();
      expect(testStore.get()).toBe(1); // 0 + 1
      
      testStore.undo();
      expect(testStore.get()).toBe(0); // initial
    });

    it('should work with object function updates', () => {
      interface Counter {
        count: number;
        name: string;
      }
      
      const testStore = store<Counter>({ count: 0, name: 'test' }, [history()]) as any;
      
      testStore.set((prev: Counter) => ({ ...prev, count: prev.count + 1 }));
      testStore.set((prev: Counter) => ({ ...prev, count: prev.count * 2 }));
      
      expect(testStore.get().count).toBe(2);
      
      testStore.undo();
      expect(testStore.get().count).toBe(1);
      
      testStore.undo();
      expect(testStore.get().count).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle many history operations efficiently', () => {
      const testStore = store(0, [history(100)]) as any;
      
      const start = performance.now();
      
      // Add 100 values
      for (let i = 1; i <= 100; i++) {
        testStore.set(i);
      }
      
      // Undo all
      while (testStore.canUndo()) {
        testStore.undo();
      }
      
      // Redo all
      while (testStore.canRedo()) {
        testStore.redo();
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
      expect(testStore.get()).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const testStore = store<string | null>('initial', [history()]) as any;
      
      testStore.set(null);
      testStore.set('restored');
      
      expect(testStore.get()).toBe('restored');
      
      testStore.undo();
      expect(testStore.get()).toBeNull();
      
      testStore.undo();
      expect(testStore.get()).toBe('initial');
    });

    it('should handle undefined values', () => {
      const testStore = store<string | undefined>('initial', [history()]) as any;
      
      testStore.set(undefined);
      testStore.set('restored');
      
      expect(testStore.get()).toBe('restored');
      
      testStore.undo();
      expect(testStore.get()).toBeUndefined();
      
      testStore.undo();
      expect(testStore.get()).toBe('initial');
    });

    it('should handle rapid consecutive calls', () => {
      const testStore = store(0, [history()]) as any;
      
      // Rapid undo/redo calls
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      testStore.undo();
      testStore.redo();
      testStore.undo();
      testStore.redo();
      
      expect(testStore.get()).toBe(3);
    });
  });
  
  describe('Integration with Other Operations', () => {
    it('should work with subscriptions', () => {
      const testStore = store(0, [history()]) as any;
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(1);
      testStore.set(2);
      
      expect(listener).toHaveBeenCalledTimes(2);
      
      testStore.undo();
      expect(listener).toHaveBeenCalledTimes(3);
      
      testStore.redo();
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });
});