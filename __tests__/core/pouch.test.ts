import { pouch, usePouch } from '../../src/core/store';
import { Plugin } from '../../src/core/types';
import { renderHook, act } from '@testing-library/react';

describe('Pouch Core Functionality', () => {
  describe('Basic Pouch Operations', () => {
    it('should create a pouch with initial value', () => {
      const testPouch = pouch(42);
      expect(testPouch.get()).toBe(42);
    });

    it('should handle string values', () => {
      const testPouch = pouch('hello');
      expect(testPouch.get()).toBe('hello');
    });

    it('should handle object values', () => {
      interface AppState {
        counter: number;
        message: string;
        isLoading: boolean;
      }
      
      const initialValue: AppState = {
        counter: 0,
        message: 'Hello World',
        isLoading: false
      };
      
      const testPouch = pouch(initialValue);
      expect(testPouch.get()).toEqual(initialValue);
    });

    it('should handle array values', () => {
      const initialValue = [1, 2, 3];
      const testPouch = pouch(initialValue);
      expect(testPouch.get()).toEqual(initialValue);
    });
  });

  describe('Setting Values', () => {
    it('should set direct values', () => {
      const testPouch = pouch(0);
      testPouch.set(42);
      expect(testPouch.get()).toBe(42);
    });

    it('should set values using function updater', () => {
      const testPouch = pouch(0);
      testPouch.set((prev) => prev + 1);
      expect(testPouch.get()).toBe(1);
    });

    it('should handle complex object updates', () => {
      interface AppState {
        counter: number;
        message: string;
        isLoading: boolean;
      }
      
      const testPouch = pouch<AppState>({
        counter: 0,
        message: 'Hello',
        isLoading: false
      });
      
      testPouch.set((prev) => ({ ...prev, counter: prev.counter + 1 }));
      expect(testPouch.get()).toEqual({
        counter: 1,
        message: 'Hello',
        isLoading: false
      });
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on value change', () => {
      const testPouch = pouch(0);
      const listener = jest.fn();
      
      testPouch.subscribe(listener);
      testPouch.set(1);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers', () => {
      const testPouch = pouch(0);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      testPouch.subscribe(listener1);
      testPouch.subscribe(listener2);
      testPouch.set(1);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe properly', () => {
      const testPouch = pouch(0);
      const listener = jest.fn();
      
      const unsubscribe = testPouch.subscribe(listener);
      testPouch.set(1);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      testPouch.set(2);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('React Integration', () => {
    it('should work with usePouch hook', () => {
      const testPouch = pouch(0);
      const { result } = renderHook(() => usePouch(testPouch));
      
      expect(result.current).toBe(0);
    });

    it('should re-render when pouch value changes', () => {
      const testPouch = pouch(0);
      const { result } = renderHook(() => usePouch(testPouch));
      
      act(() => {
        testPouch.set(1);
      });
      
      expect(result.current).toBe(1);
    });

    it('should work with built-in use() method', () => {
      const testPouch = pouch(0);
      const { result } = renderHook(() => testPouch.use());
      
      expect(result.current).toBe(0);
      
      act(() => {
        testPouch.set(1);
      });
      
      expect(result.current).toBe(1);
    });
  });

  describe('Plugin System', () => {
    it('should work without plugins', () => {
      const testPouch = pouch(0);
      expect(testPouch.get()).toBe(0);
    });

    it('should initialize with plugins', () => {
      const initializePlugin: Plugin<number> = {
        initialize: (value) => value + 1
      };
      
      const testPouch = pouch(0, [initializePlugin]);
      expect(testPouch.get()).toBe(1);
    });

    it('should call setup hooks', () => {
      const setupSpy = jest.fn();
      const setupPlugin: Plugin<number> = {
        setup: setupSpy
      };
      
      const testPouch = pouch(0, [setupPlugin]);
      expect(setupSpy).toHaveBeenCalledWith(testPouch);
    });

    it('should call onSet hooks', () => {
      const onSetSpy = jest.fn();
      const onSetPlugin: Plugin<number> = {
        onSet: onSetSpy
      };
      
      const testPouch = pouch(0, [onSetPlugin]);
      testPouch.set(1);
      
      expect(onSetSpy).toHaveBeenCalledWith(1, 0);
    });

    it('should allow plugins to transform values', () => {
      const doublePlugin: Plugin<number> = {
        onSet: (newValue) => newValue * 2
      };
      
      const testPouch = pouch(0, [doublePlugin]);
      testPouch.set(5);
      
      expect(testPouch.get()).toBe(10);
    });
  });

  describe('App State Example', () => {
    it('should work with complex app state', () => {
      interface AppState {
        counter: number;
        message: string;
        isLoading: boolean;
      }
      
      const appPouch = pouch<AppState>({
        counter: 0,
        message: 'Hello World',
        isLoading: false
      });
      
      // Test updating counter
      appPouch.set((prev) => ({ ...prev, counter: prev.counter + 1 }));
      expect(appPouch.get().counter).toBe(1);
      
      // Test updating message
      appPouch.set((prev) => ({ ...prev, message: 'Updated message' }));
      expect(appPouch.get().message).toBe('Updated message');
      
      // Test updating loading state
      appPouch.set((prev) => ({ ...prev, isLoading: true }));
      expect(appPouch.get().isLoading).toBe(true);
      
      // Test full state
      expect(appPouch.get()).toEqual({
        counter: 1,
        message: 'Updated message',
        isLoading: true
      });
    });
  });
});