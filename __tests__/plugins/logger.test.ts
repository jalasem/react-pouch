import { store } from '../../src/core/store';
import { logger } from '../../src/plugins/logger';

describe('Logger Plugin', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    group: jest.SpyInstance;
    groupCollapsed: jest.SpyInstance;
    groupEnd: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      group: jest.spyOn(console, 'group').mockImplementation(),
      groupCollapsed: jest.spyOn(console, 'groupCollapsed').mockImplementation(),
      groupEnd: jest.spyOn(console, 'groupEnd').mockImplementation(),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Basic Logging', () => {
    it('should log store initialization', () => {
      const testStore = store(42, [logger('TestStore')]);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[TestStore] Pouch initialized with:', 42);
    });

    it('should log state changes', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[TestStore\] State Change/));
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', 0);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', 1);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'number');
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should log multiple state changes', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      testStore.set(1);
      testStore.set(2);
      
      expect(consoleSpy.group).toHaveBeenCalledTimes(2);
      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(2);
    });
  });

  describe('Collapsed Option', () => {
    it('should use collapsed groups when enabled', () => {
      const testStore = store(0, [logger('TestStore', { collapsed: true })]);
      
      testStore.set(1);
      
      expect(consoleSpy.groupCollapsed).toHaveBeenCalledWith(expect.stringMatching(/^\[TestStore\] State Change/));
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it('should use regular groups when collapsed is false', () => {
      const testStore = store(0, [logger('TestStore', { collapsed: false })]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[TestStore\] State Change/));
      expect(consoleSpy.groupCollapsed).not.toHaveBeenCalled();
    });

    it('should default to regular groups', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalled();
      expect(consoleSpy.groupCollapsed).not.toHaveBeenCalled();
    });
  });

  describe('Timestamp Option', () => {
    it('should include timestamp by default', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[TestStore\] State Change \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/));
    });

    it('should include timestamp when enabled', () => {
      const testStore = store(0, [logger('TestStore', { timestamp: true })]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[TestStore\] State Change \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/));
    });

    it('should not include timestamp when disabled', () => {
      const testStore = store(0, [logger('TestStore', { timestamp: false })]);
      
      testStore.set(1);
      
      expect(consoleSpy.group).toHaveBeenCalledWith('[TestStore] State Change ');
    });
  });

  describe('Different Data Types', () => {
    it('should log string values', () => {
      const testStore = store('hello', [logger('TestStore')]);
      
      testStore.set('world');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', 'hello');
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', 'world');
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'string');
    });

    it('should log boolean values', () => {
      const testStore = store(true, [logger('TestStore')]);
      
      testStore.set(false);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', true);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', false);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'boolean');
    });

    it('should log object values', () => {
      const testStore = store({ name: 'John' }, [logger('TestStore')]);
      
      testStore.set({ name: 'Jane' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', { name: 'John' });
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', { name: 'Jane' });
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'object');
    });

    it('should log array values', () => {
      const testStore = store([1, 2, 3], [logger('TestStore')]);
      
      testStore.set([4, 5, 6]);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', [1, 2, 3]);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', [4, 5, 6]);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'object');
    });

    it('should log null values', () => {
      const testStore = store<string | null>('value', [logger('TestStore')]);
      
      testStore.set(null);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', 'value');
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', null);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'object');
    });

    it('should log undefined values', () => {
      const testStore = store<string | undefined>('value', [logger('TestStore')]);
      
      testStore.set(undefined);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', 'value');
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', undefined);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'undefined');
    });
  });

  describe('Complex Data Structures', () => {
    it('should log nested objects', () => {
      const testStore = store({ 
        user: { 
          name: 'John', 
          details: { age: 30, email: 'john@example.com' } 
        } 
      }, [logger('TestStore')]);
      
      testStore.set({ 
        user: { 
          name: 'Jane', 
          details: { age: 25, email: 'jane@example.com' } 
        } 
      });
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', { 
        user: { 
          name: 'John', 
          details: { age: 30, email: 'john@example.com' } 
        } 
      });
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', { 
        user: { 
          name: 'Jane', 
          details: { age: 25, email: 'jane@example.com' } 
        } 
      });
    });

    it('should log arrays of objects', () => {
      const testStore = store([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ], [logger('TestStore')]);
      
      testStore.set([
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' }
      ]);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', [
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' }
      ]);
    });

    it('should log Maps', () => {
      const testStore = store(new Map([['key1', 'value1']]), [logger('TestStore')]);
      
      testStore.set(new Map([['key2', 'value2']]));
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', new Map([['key1', 'value1']]));
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', new Map([['key2', 'value2']]));
    });

    it('should log Sets', () => {
      const testStore = store(new Set([1, 2, 3]), [logger('TestStore')]);
      
      testStore.set(new Set([4, 5, 6]));
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', new Set([1, 2, 3]));
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', new Set([4, 5, 6]));
    });
  });

  describe('Multiple Loggers', () => {
    it('should handle multiple loggers with different names', () => {
      const store1 = store(0, [logger('Store1')]);
      const store2 = store(0, [logger('Store2')]);
      
      store1.set(1);
      store2.set(2);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[Store1] Pouch initialized with:', 0);
      expect(consoleSpy.log).toHaveBeenCalledWith('[Store2] Pouch initialized with:', 0);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[Store1\] State Change/));
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[Store2\] State Change/));
    });

    it('should handle multiple loggers with same name', () => {
      const store1 = store(0, [logger('TestStore')]);
      const store2 = store(0, [logger('TestStore')]);
      
      store1.set(1);
      store2.set(2);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[TestStore] Pouch initialized with:', 0);
      expect(consoleSpy.log).toHaveBeenCalledTimes(8); // 2 init + 2 * (previous + current + type)
    });
  });

  describe('Function Updates', () => {
    it('should log function updates', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      testStore.set(prev => prev + 1);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', 0);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', 1);
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'number');
    });

    it('should log complex function updates', () => {
      const testStore = store({ count: 0 }, [logger('TestStore')]);
      
      testStore.set(prev => ({ ...prev, count: prev.count + 1 }));
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Previous:', { count: 0 });
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', { count: 1 });
      expect(consoleSpy.log).toHaveBeenCalledWith('Type:', 'object');
    });
  });

  describe('Performance', () => {
    it('should handle many state changes efficiently', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      const start = performance.now();
      
      for (let i = 1; i <= 100; i++) {
        testStore.set(i);
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(500); // Should complete in under 500ms
      expect(consoleSpy.group).toHaveBeenCalledTimes(100);
      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string store name', () => {
      const testStore = store(0, [logger('')]);
      
      testStore.set(1);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[] Pouch initialized with:', 0);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[\] State Change/));
    });

    it('should handle special characters in store name', () => {
      const testStore = store(0, [logger('Test[Store]<>&')]);
      
      testStore.set(1);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[Test[Store]<>&] Pouch initialized with:', 0);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[Test\[Store\]<>&\] State Change/));
    });

    it('should handle unicode characters in store name', () => {
      const testStore = store(0, [logger('Test🚀Store')]);
      
      testStore.set(1);
      
      expect(consoleSpy.log).toHaveBeenCalledWith('[Test🚀Store] Pouch initialized with:', 0);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/^\[Test🚀Store\] State Change/));
    });
  });

  describe('Integration', () => {
    it('should not affect store behavior', () => {
      const testStore = store(0, [logger('TestStore')]);
      
      expect(testStore.get()).toBe(0);
      
      testStore.set(1);
      expect(testStore.get()).toBe(1);
      
      testStore.set(prev => prev + 1);
      expect(testStore.get()).toBe(2);
    });

    it('should work with subscriptions', () => {
      const testStore = store(0, [logger('TestStore')]);
      const listener = jest.fn();
      
      testStore.subscribe(listener);
      testStore.set(1);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledWith('Current:', 1);
    });

    it('should preserve value types', () => {
      const testStore = store<number | string>(0, [logger('TestStore')]);
      
      testStore.set('hello');
      expect(typeof testStore.get()).toBe('string');
      
      testStore.set(42);
      expect(typeof testStore.get()).toBe('number');
    });
  });
});