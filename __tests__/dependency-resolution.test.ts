/**
 * Test that importing react-pouch doesn't require AsyncStorage dependency
 * This test ensures the fix for the bundler dependency resolution issue
 */

describe('Dependency Resolution', () => {
  beforeEach(() => {
    // Clear any cached modules
    jest.resetModules();
  });

  it('should allow importing the main library without AsyncStorage', () => {
    // This should not throw an error even if AsyncStorage is not available
    expect(() => {
      require('../src/index');
    }).not.toThrow();
  });

  it('should allow importing rnPersist specifically without AsyncStorage', () => {
    // This should not throw an error even if AsyncStorage is not available
    expect(() => {
      require('../src/plugins/rnPersist');
    }).not.toThrow();
  });

  it('should allow creating rnPersist plugin without AsyncStorage', () => {
    const { rnPersist } = require('../src/plugins/rnPersist');
    
    // Creating the plugin should not throw
    expect(() => {
      const plugin = rnPersist('test-key');
      expect(plugin).toBeDefined();
      expect(typeof plugin.setup).toBe('function');
    }).not.toThrow();
  });

  it('should handle missing AsyncStorage gracefully when using rnPersist', () => {
    const { pouch } = require('../src/core/store');
    const { rnPersist } = require('../src/plugins/rnPersist');
    
    // Mock console.warn to capture warnings
    const originalWarn = console.warn;
    const mockWarn = jest.fn();
    console.warn = mockWarn;
    
    try {
      // Create a pouch with rnPersist plugin (pass as array)
      const testPouch = pouch(0, [rnPersist('test-key')]);
      
      // Plugin should be created successfully
      expect(testPouch).toBeDefined();
      expect(typeof testPouch.get).toBe('function');
      expect(typeof testPouch.set).toBe('function');
      
      // Should have storage info method
      expect(typeof testPouch.getStorageInfo).toBe('function');
      
      // Storage should be marked as unavailable
      const storageInfo = testPouch.getStorageInfo();
      expect(storageInfo.available).toBe(false);
      expect(storageInfo.type).toBe('AsyncStorage');
      
      // Should have warned about missing AsyncStorage
      expect(mockWarn).toHaveBeenCalledWith(
        'rnPersist: AsyncStorage not available. Install @react-native-async-storage/async-storage or provide asyncStorage option.'
      );
      
    } finally {
      // Restore console.warn
      console.warn = originalWarn;
    }
  });

  it('should work with custom asyncStorage option', () => {
    const { pouch } = require('../src/core/store');
    const { rnPersist } = require('../src/plugins/rnPersist');
    
    // Mock AsyncStorage
    const mockAsyncStorage = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };
    
    // Create a pouch with custom asyncStorage (pass as array)
    const testPouch = pouch(0, [rnPersist('test-key', { asyncStorage: mockAsyncStorage })]);
    
    // Plugin should be created successfully
    expect(testPouch).toBeDefined();
    
    // Storage should be marked as available
    const storageInfo = testPouch.getStorageInfo();
    expect(storageInfo.available).toBe(true);
    expect(storageInfo.type).toBe('AsyncStorage');
  });
});