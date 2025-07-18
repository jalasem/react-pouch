import { store } from '../../src/core/store';
import { throttle } from '../../src/plugins/throttle';

describe('Throttle Plugin', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Throttling', () => {
    it('should allow first update immediately', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(1);
      
      expect(testStore.get()).toBe(1); // Should update immediately
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should throttle subsequent updates', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(1); // Immediate
      expect(testStore.get()).toBe(1);
      expect(listener).toHaveBeenCalledTimes(1);
      
      testStore.set(2); // Should be throttled
      expect(testStore.get()).toBe(1); // Should not update immediately
      expect(listener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(2); // Should update after throttle period
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should use latest value when multiple updates are throttled', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(1); // Immediate
      testStore.set(2); // Throttled
      testStore.set(3); // Throttled, replaces 2
      
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(3); // Should use latest value
    });

    it('should allow updates after throttle period expires', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(1); // Immediate
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(100);
      
      testStore.set(2); // Should be immediate after period
      expect(testStore.get()).toBe(2);
    });
  });

  describe('Function Updates', () => {
    it('should work with function updates', () => {
      const testStore = store(5, [throttle(100)]);
      
      testStore.set((prev) => prev + 1); // Immediate
      expect(testStore.get()).toBe(6);
      
      testStore.set((prev) => prev + 2); // Throttled
      expect(testStore.get()).toBe(6);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(8); // Should use current value (6) + 2
    });

    it('should handle multiple function updates', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set((prev) => prev + 1); // Immediate, 0 + 1 = 1
      testStore.set((prev) => prev + 2); // Throttled
      testStore.set((prev) => prev + 3); // Throttled, replaces previous
      
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(4); // Should use current value (1) + 3
    });

    it('should mix direct values and function updates', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(5); // Immediate
      testStore.set((prev) => prev + 1); // Throttled
      testStore.set(10); // Throttled, replaces function
      
      expect(testStore.get()).toBe(5);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(10); // Should use direct value
    });
  });

  describe('Complex Data Types', () => {
    it('should work with objects', () => {
      const testStore = store({ count: 0 }, [throttle(100)]);
      
      testStore.set({ count: 1 }); // Immediate
      expect(testStore.get().count).toBe(1);
      
      testStore.set({ count: 2 }); // Throttled
      expect(testStore.get().count).toBe(1);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get().count).toBe(2);
    });

    it('should work with arrays', () => {
      const testStore = store([1, 2, 3], [throttle(100)]);
      
      testStore.set([4, 5, 6]); // Immediate
      expect(testStore.get()).toEqual([4, 5, 6]);
      
      testStore.set([7, 8, 9]); // Throttled
      expect(testStore.get()).toEqual([4, 5, 6]);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toEqual([7, 8, 9]);
    });

    it('should work with nested objects', () => {
      const testStore = store({ user: { name: 'John', age: 30 } }, [throttle(100)]);
      
      testStore.set({ user: { name: 'Jane', age: 25 } }); // Immediate
      expect(testStore.get().user.name).toBe('Jane');
      
      testStore.set({ user: { name: 'Bob', age: 35 } }); // Throttled
      expect(testStore.get().user.name).toBe('Jane');
      
      jest.advanceTimersByTime(100);
      expect(testStore.get().user.name).toBe('Bob');
    });
  });

  describe('Subscription Behavior', () => {
    it('should notify subscribers immediately for first update', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(1);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should notify subscribers after throttle period', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set(1); // Immediate
      testStore.set(2); // Throttled
      
      expect(listener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should work with multiple subscribers', () => {
      const testStore = store(0, [throttle(100)]);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      testStore.subscribe(listener1);
      testStore.subscribe(listener2);
      
      testStore.set(1);
      testStore.set(2);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      
      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('should handle unsubscribe during throttle', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      
      testStore.set(1);
      testStore.set(2);
      
      unsubscribe();
      
      jest.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(1); // Only the immediate call
    });
  });

  describe('Timing Behavior', () => {
    it('should handle exact timing boundaries', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(1); // Immediate
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(99);
      testStore.set(2); // Should still be throttled
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(1); // Now at 100ms
      expect(testStore.get()).toBe(2);
      
      jest.advanceTimersByTime(100); // Wait for next period
      testStore.set(3); // Should be immediate again
      expect(testStore.get()).toBe(3);
    });

    it('should reset throttle timer after each execution', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(1); // Immediate
      expect(testStore.get()).toBe(1);
      testStore.set(2); // Throttled
      expect(testStore.get()).toBe(1);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(2);
      
      jest.advanceTimersByTime(100); // Wait for next period
      testStore.set(3); // Should be immediate
      expect(testStore.get()).toBe(3);
      
      testStore.set(4); // Should be throttled
      expect(testStore.get()).toBe(3);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(4);
    });

    it('should handle multiple throttle periods', () => {
      const testStore = store(0, [throttle(50)]);
      
      testStore.set(1); // Immediate
      testStore.set(2); // Throttled
      
      jest.advanceTimersByTime(50);
      expect(testStore.get()).toBe(2);
      
      testStore.set(3); // Immediate
      testStore.set(4); // Throttled
      
      jest.advanceTimersByTime(50);
      expect(testStore.get()).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero throttle time', () => {
      const testStore = store(0, [throttle(0)]);
      
      testStore.set(1);
      testStore.set(2);
      
      jest.advanceTimersByTime(0);
      expect(testStore.get()).toBe(2);
    });

    it('should handle null values', () => {
      const testStore = store<number | null>(0, [throttle(100)]);
      
      testStore.set(null); // Immediate
      expect(testStore.get()).toBeNull();
      
      testStore.set(1); // Throttled
      expect(testStore.get()).toBeNull();
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(1);
    });

    it('should handle undefined values', () => {
      const testStore = store<number | undefined>(0, [throttle(100)]);
      
      testStore.set(undefined); // Immediate
      expect(testStore.get()).toBeUndefined();
      
      testStore.set(1); // Throttled
      expect(testStore.get()).toBeUndefined();
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(1);
    });

    it('should handle boolean values', () => {
      const testStore = store(true, [throttle(100)]);
      
      testStore.set(false); // Immediate
      expect(testStore.get()).toBe(false);
      
      testStore.set(true); // Throttled
      expect(testStore.get()).toBe(false);
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(true);
    });

    it('should handle empty strings', () => {
      const testStore = store('initial', [throttle(100)]);
      
      testStore.set(''); // Immediate
      expect(testStore.get()).toBe('');
      
      testStore.set('updated'); // Throttled
      expect(testStore.get()).toBe('');
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe('updated');
    });
  });

  describe('Performance', () => {
    it('should handle many rapid updates efficiently', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      // Make 1000 rapid updates
      for (let i = 1; i <= 1000; i++) {
        testStore.set(i);
      }
      
      expect(testStore.get()).toBe(1); // Should have only the first value
      expect(listener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      
      expect(testStore.get()).toBe(1000); // Should have the last value
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle alternating rapid and slow updates', () => {
      const testStore = store(0, [throttle(100)]);
      
      testStore.set(1); // Immediate
      testStore.set(2); // Throttled
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(2);
      
      testStore.set(3); // Immediate
      testStore.set(4); // Throttled
      
      jest.advanceTimersByTime(100);
      expect(testStore.get()).toBe(4);
    });
  });

  describe('Integration with Core Store', () => {
    it('should preserve get() behavior', () => {
      const testStore = store(42, [throttle(100)]);
      
      expect(testStore.get()).toBe(42);
      
      testStore.set(100);
      expect(testStore.get()).toBe(100); // Should update immediately first time
    });

    it('should preserve subscribe behavior', () => {
      const testStore = store(0, [throttle(100)]);
      const listener = jest.fn();
      
      const unsubscribe = testStore.subscribe(listener);
      
      testStore.set(1);
      testStore.set(2);
      
      expect(listener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(2);
      
      unsubscribe();
      
      testStore.set(3);
      jest.advanceTimersByTime(100);
      
      expect(listener).toHaveBeenCalledTimes(2); // Should not be called again
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle search input throttling', () => {
      const searchStore = store('', [throttle(300)]);
      const searchListener = jest.fn();
      
      searchStore.subscribe(searchListener);
      
      // User types "hello" rapidly
      searchStore.set('h');
      searchStore.set('he');
      searchStore.set('hel');
      searchStore.set('hell');
      searchStore.set('hello');
      
      expect(searchStore.get()).toBe('h'); // Only first update
      expect(searchListener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(300);
      
      expect(searchStore.get()).toBe('hello'); // Final value
      expect(searchListener).toHaveBeenCalledTimes(2);
    });

    it('should handle button click throttling', () => {
      const clickStore = store(0, [throttle(1000)]);
      const clickListener = jest.fn();
      
      clickStore.subscribe(clickListener);
      
      // Rapid button clicks
      clickStore.set(1);
      clickStore.set(2);
      clickStore.set(3);
      
      expect(clickStore.get()).toBe(1); // Only first click
      expect(clickListener).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1000);
      
      expect(clickStore.get()).toBe(3); // Latest click
      expect(clickListener).toHaveBeenCalledTimes(2);
    });
  });
});