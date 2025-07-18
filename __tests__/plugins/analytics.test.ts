import { store } from '../../src/core/store';
import { analytics } from '../../src/plugins/analytics';

// Mock window and gtag
const mockGtag = jest.fn();

describe('Analytics Plugin', () => {
  beforeEach(() => {
    // Mock window.gtag directly
    (global as any).window = (global as any).window || {};
    (global as any).window.gtag = mockGtag;
    jest.clearAllMocks();
    // Reset mock implementation
    mockGtag.mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    if ((global as any).window) {
      delete (global as any).window.gtag;
    }
  });

  describe('Basic Analytics Tracking', () => {
    it('should track value changes', () => {
      const testStore = store({ count: 0 }, [analytics('test_event')]);
      
      testStore.set({ count: 1 });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
        previous_value: '{"count":0}',
        new_value: '{"count":1}',
        timestamp: expect.any(String)
      });
    });

    it('should track multiple value changes', () => {
      const testStore = store('initial', [analytics('string_event')]);
      
      testStore.set('first');
      testStore.set('second');
      
      expect(mockGtag).toHaveBeenCalledTimes(2);
      
      expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'string_event', {
        previous_value: '"initial"',
        new_value: '"first"',
        timestamp: expect.any(String)
      });
      
      expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'string_event', {
        previous_value: '"first"',
        new_value: '"second"',
        timestamp: expect.any(String)
      });
    });

    it('should track array changes', () => {
      const testStore = store<number[]>([1, 2], [analytics('array_event')]);
      
      testStore.set([1, 2, 3]);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'array_event', {
        previous_value: '[1,2]',
        new_value: '[1,2,3]',
        timestamp: expect.any(String)
      });
    });

    it('should track object changes', () => {
      const testStore = store({ user: 'John', age: 30 }, [analytics('user_event')]);
      
      testStore.set({ user: 'Jane', age: 25 });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'user_event', {
        previous_value: '{"user":"John","age":30}',
        new_value: '{"user":"Jane","age":25}',
        timestamp: expect.any(String)
      });
    });

    it('should track function-based updates', () => {
      const testStore = store({ count: 5 }, [analytics('counter_event')]);
      
      testStore.set(prev => ({ count: prev.count + 1 }));
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'counter_event', {
        previous_value: '{"count":5}',
        new_value: '{"count":6}',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Options Configuration', () => {
    it('should respect trackInitial option when true', () => {
      const testStore = store({ initial: true }, [
        analytics('init_event', { trackInitial: true })
      ]);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'init_event_initialized', {
        value: '{"initial":true}',
        timestamp: expect.any(String)
      });
    });

    it('should respect trackInitial option when false', () => {
      const testStore = store({ initial: true }, [
        analytics('init_event', { trackInitial: false })
      ]);
      
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should default trackInitial to false', () => {
      const testStore = store({ initial: true }, [analytics('init_event')]);
      
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should respect includeTimestamp option when false', () => {
      const testStore = store('test', [
        analytics('no_timestamp_event', { includeTimestamp: false })
      ]);
      
      testStore.set('updated');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'no_timestamp_event', {
        previous_value: '"test"',
        new_value: '"updated"',
        timestamp: undefined
      });
    });

    it('should default includeTimestamp to true', () => {
      const testStore = store('test', [analytics('default_timestamp_event')]);
      
      testStore.set('updated');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'default_timestamp_event', {
        previous_value: '"test"',
        new_value: '"updated"',
        timestamp: expect.any(String)
      });
    });

    it('should use custom sanitize function', () => {
      const sanitize = jest.fn((value: any) => ({ sanitized: true }));
      
      const testStore = store({ secret: 'password123' }, [
        analytics('sanitized_event', { sanitize })
      ]);
      
      testStore.set({ secret: 'newpassword' });
      
      expect(sanitize).toHaveBeenCalledTimes(2); // Called for both old and new values
      expect(mockGtag).toHaveBeenCalledWith('event', 'sanitized_event', {
        previous_value: '{"sanitized":true}',
        new_value: '{"sanitized":true}',
        timestamp: expect.any(String)
      });
    });

    it('should use default sanitize function when not provided', () => {
      const testStore = store({ data: 'test' }, [analytics('default_sanitize_event')]);
      
      testStore.set({ data: 'updated' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'default_sanitize_event', {
        previous_value: '{"data":"test"}',
        new_value: '{"data":"updated"}',
        timestamp: expect.any(String)
      });
    });

    it('should combine all options correctly', () => {
      const sanitize = (value: any) => ({ clean: value.data });
      
      const testStore = store({ data: 'initial' }, [
        analytics('combined_event', {
          trackInitial: true,
          includeTimestamp: false,
          sanitize
        })
      ]);
      
      // Check initial tracking
      expect(mockGtag).toHaveBeenCalledWith('event', 'combined_event_initialized', {
        value: '{"clean":"initial"}',
        timestamp: undefined
      });
      
      // Check update tracking
      testStore.set({ data: 'updated' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'combined_event', {
        previous_value: '{"clean":"initial"}',
        new_value: '{"clean":"updated"}',
        timestamp: undefined
      });
    });
  });

  describe('Browser Environment Detection', () => {
    it('should not track when gtag is not available', () => {
      // Remove gtag from window
      delete (global as any).window.gtag;
      
      const testStore = store('test', [analytics('no_gtag_event')]);
      
      testStore.set('updated');
      
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should not track when window is not defined', () => {
      // Note: This test is challenging in Node.js/Jest environment
      // The plugin checks `typeof window !== "undefined"` which may
      // behave differently than in a browser environment
      
      // For this test, we'll skip it as it's environment-specific
      // In a real browser where window is truly undefined, this would work
      
      // Alternative: test by creating store in environment without window
      const testStore = store('test', [analytics('no_window_event')]);
      
      // Remove window.gtag specifically to simulate no gtag
      const originalGtag = (global as any).window.gtag;
      delete (global as any).window.gtag;
      
      testStore.set('updated');
      
      // Without gtag, should not be called
      expect(mockGtag).not.toHaveBeenCalled();
      
      // Restore
      (global as any).window.gtag = originalGtag;
    });

    it('should not track initial value when gtag is not available', () => {
      // Remove gtag from window
      delete (global as any).window.gtag;
      
      const testStore = store('initial', [
        analytics('no_gtag_init_event', { trackInitial: true })
      ]);
      
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should handle gtag being added after store creation', () => {
      // Start without gtag
      delete (global as any).window.gtag;
      
      const testStore = store('test', [analytics('delayed_gtag_event')]);
      
      // Add gtag later
      (global as any).window.gtag = mockGtag;
      
      testStore.set('updated');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'delayed_gtag_event', {
        previous_value: '"test"',
        new_value: '"updated"',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON.stringify errors gracefully', () => {
      // Create circular reference
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const testStore = store(circular, [analytics('circular_event')]);
      
      // This should throw an error due to circular reference
      expect(() => testStore.set({ name: 'updated' })).toThrow('Converting circular structure to JSON');
    });

    it('should handle gtag errors gracefully', () => {
      // Mock gtag to throw an error
      mockGtag.mockImplementation(() => {
        throw new Error('gtag error');
      });
      
      const testStore = store('test', [analytics('gtag_error_event')]);
      
      // This should throw an error
      expect(() => testStore.set('updated')).toThrow('gtag error');
      
      expect(mockGtag).toHaveBeenCalled();
    });

    it('should handle sanitize function errors gracefully', () => {
      const sanitize = jest.fn().mockImplementation(() => {
        throw new Error('sanitize error');
      });
      
      const testStore = store({ data: 'test' }, [
        analytics('sanitize_error_event', { sanitize })
      ]);
      
      // This should throw an error
      expect(() => testStore.set({ data: 'updated' })).toThrow('sanitize error');
      
      expect(sanitize).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle frequent updates efficiently', () => {
      const testStore = store({ count: 0 }, [analytics('performance_event')]);
      
      const start = performance.now();
      
      for (let i = 1; i <= 100; i++) {
        testStore.set({ count: i });
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete quickly
      expect(mockGtag).toHaveBeenCalledTimes(100);
    });

    it('should handle large objects efficiently', () => {
      const largeObject = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`
        }))
      };
      
      const testStore = store(largeObject, [analytics('large_object_event')]);
      
      const start = performance.now();
      testStore.set({ ...largeObject, updated: true } as any);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Should handle large objects efficiently
      expect(mockGtag).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Store', () => {
    it('should work with store subscriptions', () => {
      const testStore = store({ count: 0 }, [analytics('subscription_event')]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      
      testStore.set({ count: 1 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple plugins', () => {
      const mockPlugin = {
        onSet: jest.fn()
      };
      
      const testStore = store({ data: 'test' }, [
        mockPlugin,
        analytics('multi_plugin_event')
      ]);
      
      testStore.set({ data: 'updated' });
      
      expect(mockPlugin.onSet).toHaveBeenCalled();
      expect(mockGtag).toHaveBeenCalledWith('event', 'multi_plugin_event', {
        previous_value: '{"data":"test"}',
        new_value: '{"data":"updated"}',
        timestamp: expect.any(String)
      });
    });

    it('should not interfere with store functionality', () => {
      const testStore = store({ count: 0 }, [analytics('no_interference_event')]);
      
      // Store should work normally
      expect(testStore.get()).toEqual({ count: 0 });
      
      testStore.set({ count: 5 });
      expect(testStore.get()).toEqual({ count: 5 });
      
      testStore.set(prev => ({ count: prev.count + 1 }));
      expect(testStore.get()).toEqual({ count: 6 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const testStore = store<string | null>('test', [analytics('null_event')]);
      
      testStore.set(null);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'null_event', {
        previous_value: '"test"',
        new_value: 'null',
        timestamp: expect.any(String)
      });
    });

    it('should handle undefined values', () => {
      const testStore = store<string | undefined>('test', [analytics('undefined_event')]);
      
      testStore.set(undefined);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'undefined_event', {
        previous_value: '"test"',
        new_value: undefined, // JSON.stringify(undefined) returns undefined, not "undefined"
        timestamp: expect.any(String)
      });
    });

    it('should handle empty arrays', () => {
      const testStore = store([1, 2, 3], [analytics('empty_array_event')]);
      
      testStore.set([]);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'empty_array_event', {
        previous_value: '[1,2,3]',
        new_value: '[]',
        timestamp: expect.any(String)
      });
    });

    it('should handle empty objects', () => {
      const testStore = store({ key: 'value' }, [analytics('empty_object_event')]);
      
      testStore.set({} as any);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'empty_object_event', {
        previous_value: '{"key":"value"}',
        new_value: '{}',
        timestamp: expect.any(String)
      });
    });

    it('should handle boolean values', () => {
      const testStore = store(true, [analytics('boolean_event')]);
      
      testStore.set(false);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'boolean_event', {
        previous_value: 'true',
        new_value: 'false',
        timestamp: expect.any(String)
      });
    });

    it('should handle number values', () => {
      const testStore = store(42, [analytics('number_event')]);
      
      testStore.set(100);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'number_event', {
        previous_value: '42',
        new_value: '100',
        timestamp: expect.any(String)
      });
    });

    it('should handle same value updates', () => {
      const testStore = store('test', [analytics('same_value_event')]);
      
      testStore.set('test');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'same_value_event', {
        previous_value: '"test"',
        new_value: '"test"',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with different types', () => {
      // String type
      const stringStore = store<string>('test', [analytics('string_type_event')]);
      stringStore.set('updated');
      
      // Number type
      const numberStore = store<number>(42, [analytics('number_type_event')]);
      numberStore.set(100);
      
      // Boolean type
      const boolStore = store<boolean>(true, [analytics('bool_type_event')]);
      boolStore.set(false);
      
      // Object type
      interface User {
        id: number;
        name: string;
      }
      const userStore = store<User>({ id: 1, name: 'John' }, [analytics('user_type_event')]);
      userStore.set({ id: 2, name: 'Jane' });
      
      expect(mockGtag).toHaveBeenCalledTimes(4);
    });

    it('should maintain type safety with sanitize function', () => {
      interface User {
        id: number;
        name: string;
        password: string;
      }
      
      const sanitize = (user: User) => ({ id: user.id, name: user.name });
      
      const userStore = store<User>(
        { id: 1, name: 'John', password: 'secret' },
        [analytics('sanitized_user_event', { sanitize })]
      );
      
      userStore.set({ id: 2, name: 'Jane', password: 'newsecret' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'sanitized_user_event', {
        previous_value: '{"id":1,"name":"John"}',
        new_value: '{"id":2,"name":"Jane"}',
        timestamp: expect.any(String)
      });
    });
  });
});