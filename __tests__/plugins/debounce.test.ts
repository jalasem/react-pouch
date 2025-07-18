import { store } from '../../src/core/store';
import { debounce } from '../../src/plugins/debounce';

describe('Debounce Plugin', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Debouncing', () => {
    it('should delay value updates', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(1);
      
      expect(testStore.get()).toBe(0); // Should not update immediately
      expect(listener).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(1); // Should update after delay
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous timeouts on rapid updates', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(1);
      jest.advanceTimersByTime(50);
      
      testStore.set(2);
      jest.advanceTimersByTime(50);
      
      testStore.set(3);
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(3); // Only latest value should be set
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should work with different delay values', () => {
      const shortStore = store(0, [debounce(50)]);
      const longStore = store(0, [debounce(200)]);
      
      shortStore.set(1);
      longStore.set(1);
      
      jest.advanceTimersByTime(50);
      expect(shortStore.get()).toBe(1);
      expect(longStore.get()).toBe(0);
      
      jest.advanceTimersByTime(150);
      expect(longStore.get()).toBe(1);
    });
  });

  describe('Function Updates', () => {
    it('should work with function updates', () => {
      const testStore = store(5, [debounce(100)]);
      
      testStore.set((prev) => prev + 1);
      expect(testStore.get()).toBe(5); // Should not update immediately
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(6); // Should use prev value from when called
    });

    it('should handle multiple function updates', () => {
      const testStore = store(0, [debounce(100)]);
      
      testStore.set((prev) => prev + 1);
      testStore.set((prev) => prev + 2);
      testStore.set((prev) => prev + 3);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(3); // Should apply only the last function
    });

    it('should mix direct values and function updates', () => {
      const testStore = store(0, [debounce(100)]);
      
      testStore.set(5);
      testStore.set((prev) => prev + 1);
      testStore.set(10);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(10); // Should use the last direct value
    });
  });

  describe('Complex Data Types', () => {
    it('should work with objects', () => {
      const testStore = store({ count: 0 }, [debounce(100)]);
      
      testStore.set({ count: 1 });
      testStore.set({ count: 2 });
      
      expect(testStore.get().count).toBe(0);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get().count).toBe(2);
    });

    it('should work with arrays', () => {
      const testStore = store([1, 2, 3], [debounce(100)]);
      
      testStore.set([4, 5, 6]);
      testStore.set([7, 8, 9]);
      
      expect(testStore.get()).toEqual([1, 2, 3]);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toEqual([7, 8, 9]);
    });

    it('should work with nested objects', () => {
      const testStore = store({ user: { name: 'John', age: 30 } }, [debounce(100)]);
      
      testStore.set({ user: { name: 'Jane', age: 25 } });
      
      expect(testStore.get().user.name).toBe('John');
      
      jest.advanceTimersByTime(100);
      expect(testStore.get().user.name).toBe('Jane');
    });
  });

  describe('Subscription Behavior', () => {
    it('should notify subscribers only after delay', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      
      expect(listener).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple subscribers', () => {
      const testStore = store(0, [debounce(100)]);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      testStore.subscribe(listener1);
      testStore.subscribe(listener2);
      
      testStore.set(1);
      jest.advanceTimersByTime(100);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe during debounce', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      
      testStore.set(1);
      unsubscribe();
      
      jest.advanceTimersByTime(100);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const testStore = store(0, [debounce(0)]);
      
      testStore.set(1);
      expect(testStore.get()).toBe(0);
      
      jest.advanceTimersByTime(0);
      expect(testStore.get()).toBe(1);
    });

    it('should handle null values', () => {
      const testStore = store<number | null>(0, [debounce(100)]);
      
      testStore.set(null);
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBeNull();
    });

    it('should handle undefined values', () => {
      const testStore = store<number | undefined>(0, [debounce(100)]);
      
      testStore.set(undefined);
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBeUndefined();
    });

    it('should handle boolean values', () => {
      const testStore = store(true, [debounce(100)]);
      
      testStore.set(false);
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(false);
    });

    it('should handle empty strings', () => {
      const testStore = store('initial', [debounce(100)]);
      
      testStore.set('');
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle many rapid updates efficiently', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      // Make 1000 rapid updates
      for (let i = 1; i <= 1000; i++) {
        testStore.set(i);
      }
      
      expect(testStore.get()).toBe(0); // Should not update yet
      expect(listener).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(1000); // Should have only the last value
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timing Edge Cases', () => {
    it('should handle updates exactly at delay boundary', () => {
      const testStore = store(0, [debounce(100)]);
      
      testStore.set(1);
      jest.advanceTimersByTime(99);
      
      testStore.set(2);
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(2);
    });

    it('should handle rapid succession of updates', () => {
      const testStore = store(0, [debounce(100)]);
      
      testStore.set(1);
      testStore.set(2);
      testStore.set(3);
      testStore.set(4);
      testStore.set(5);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(5);
    });

    it('should handle updates after delay has passed', () => {
      const testStore = store(0, [debounce(100)]);
      
      testStore.set(1);
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(1);
      
      testStore.set(2);
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(2);
    });
  });

  describe('Integration with Core Store', () => {
    it('should preserve get() behavior', () => {
      const testStore = store(42, [debounce(100)]);
      
      expect(testStore.get()).toBe(42);
      
      testStore.set(100);
      expect(testStore.get()).toBe(42); // Should not change until debounce completes
    });

    it('should preserve subscribe behavior', () => {
      const testStore = store(0, [debounce(100)]);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      
      testStore.set(1);
      jest.advanceTimersByTime(100);
      
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      testStore.set(2);
      jest.advanceTimersByTime(100);
      
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});