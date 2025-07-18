import { store } from '../../src/core/store';
import { validate } from '../../src/plugins/validate';

describe('Validate Plugin', () => {
  describe('Basic Validation', () => {
    it('should allow valid values', () => {
      const emailValidator = (email: string) => ({
        isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        error: 'Invalid email format'
      });
      
      const testStore = store('', [validate(emailValidator)]);
      
      expect(() => testStore.set('test@example.com')).not.toThrow();
      expect(testStore.get()).toBe('test@example.com');
    });

    it('should reject invalid values', () => {
      const emailValidator = (email: string) => ({
        isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        error: 'Invalid email format'
      });
      
      const testStore = store('', [validate(emailValidator)]);
      
      expect(() => testStore.set('invalid-email')).toThrow('Invalid email format');
      expect(testStore.get()).toBe(''); // Should remain unchanged
    });

    it('should throw error for invalid values', () => {
      const validator = (value: string) => ({
        isValid: value.length > 0,
        error: 'Value cannot be empty'
      });
      
      const testStore = store('initial', [validate(validator)]);
      
      expect(() => testStore.set('')).toThrow('Value cannot be empty');
      expect(testStore.get()).toBe('initial'); // Should remain unchanged
    });
  });

  describe('Number Validation', () => {
    it('should validate positive numbers', () => {
      const positiveValidator = (value: number) => ({
        isValid: value > 0,
        error: 'Number must be positive'
      });
      
      const testStore = store(1, [validate(positiveValidator)]);
      
      expect(() => testStore.set(5)).not.toThrow();
      expect(testStore.get()).toBe(5);
      
      expect(() => testStore.set(-1)).toThrow('Number must be positive');
      expect(testStore.get()).toBe(5); // Should remain unchanged
    });

    it('should validate number ranges', () => {
      const rangeValidator = (value: number) => ({
        isValid: value >= 0 && value <= 100,
        error: 'Number must be between 0 and 100'
      });
      
      const testStore = store(50, [validate(rangeValidator)]);
      
      expect(() => testStore.set(75)).not.toThrow();
      expect(() => testStore.set(101)).toThrow('Number must be between 0 and 100');
      expect(() => testStore.set(-1)).toThrow('Number must be between 0 and 100');
    });
  });

  describe('Object Validation', () => {
    it('should validate object properties', () => {
      interface User {
        name: string;
        age: number;
        email: string;
      }
      
      const userValidator = (user: User) => {
        if (!user.name || user.name.length < 2) {
          return { isValid: false, error: 'Name must be at least 2 characters' };
        }
        if (user.age < 0 || user.age > 120) {
          return { isValid: false, error: 'Age must be between 0 and 120' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
          return { isValid: false, error: 'Invalid email format' };
        }
        return { isValid: true };
      };
      
      const testStore = store<User>({
        name: 'John',
        age: 30,
        email: 'john@example.com'
      }, [validate(userValidator)]);
      
      expect(() => testStore.set({
        name: 'Jane',
        age: 25,
        email: 'jane@example.com'
      })).not.toThrow();
      
      expect(() => testStore.set({
        name: 'J',
        age: 25,
        email: 'jane@example.com'
      })).toThrow('Name must be at least 2 characters');
      
      expect(() => testStore.set({
        name: 'Jane',
        age: 150,
        email: 'jane@example.com'
      })).toThrow('Age must be between 0 and 120');
      
      expect(() => testStore.set({
        name: 'Jane',
        age: 25,
        email: 'invalid-email'
      })).toThrow('Invalid email format');
    });
  });

  describe('Array Validation', () => {
    it('should validate array contents', () => {
      const arrayValidator = (values: number[]) => {
        if (values.length === 0) {
          return { isValid: false, error: 'Array cannot be empty' };
        }
        if (values.some(v => v < 0)) {
          return { isValid: false, error: 'All values must be positive' };
        }
        return { isValid: true };
      };
      
      const testStore = store([1, 2, 3], [validate(arrayValidator)]);
      
      expect(() => testStore.set([4, 5, 6])).not.toThrow();
      expect(() => testStore.set([])).toThrow('Array cannot be empty');
      expect(() => testStore.set([1, -2, 3])).toThrow('All values must be positive');
    });
  });

  describe('Custom Validation Messages', () => {
    it('should handle validator without error message', () => {
      const validator = (value: string) => ({
        isValid: value.length > 0
      });
      
      const testStore = store('initial', [validate(validator)]);
      
      expect(() => testStore.set('')).toThrow('Validation failed');
    });

    it('should handle dynamic error messages', () => {
      const lengthValidator = (value: string) => {
        const minLength = 5;
        return {
          isValid: value.length >= minLength,
          error: `String must be at least ${minLength} characters, got ${value.length}`
        };
      };
      
      const testStore = store('initial', [validate(lengthValidator)]);
      
      expect(() => testStore.set('abc')).toThrow('String must be at least 5 characters, got 3');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate nested objects', () => {
      interface Address {
        street: string;
        city: string;
        zipCode: string;
      }
      
      interface User {
        name: string;
        address: Address;
      }
      
      const userValidator = (user: User) => {
        if (!user.name) {
          return { isValid: false, error: 'Name is required' };
        }
        if (!user.address.street) {
          return { isValid: false, error: 'Street is required' };
        }
        if (!user.address.city) {
          return { isValid: false, error: 'City is required' };
        }
        if (!/^\d{5}$/.test(user.address.zipCode)) {
          return { isValid: false, error: 'Invalid zip code format' };
        }
        return { isValid: true };
      };
      
      const testStore = store<User>({
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: '10001'
        }
      }, [validate(userValidator)]);
      
      expect(() => testStore.set({
        name: 'Jane',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          zipCode: '90210'
        }
      })).not.toThrow();
      
      expect(() => testStore.set({
        name: 'Jane',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          zipCode: 'invalid'
        }
      })).toThrow('Invalid zip code format');
    });

    it('should validate with multiple conditions', () => {
      const passwordValidator = (password: string) => {
        if (password.length < 8) {
          return { isValid: false, error: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
          return { isValid: false, error: 'Password must contain uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
          return { isValid: false, error: 'Password must contain lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
          return { isValid: false, error: 'Password must contain number' };
        }
        if (!/[!@#$%^&*]/.test(password)) {
          return { isValid: false, error: 'Password must contain special character' };
        }
        return { isValid: true };
      };
      
      const testStore = store('', [validate(passwordValidator)]);
      
      expect(() => testStore.set('Password123!')).not.toThrow();
      expect(() => testStore.set('short')).toThrow('Password must be at least 8 characters');
      expect(() => testStore.set('password123!')).toThrow('Password must contain uppercase letter');
      expect(() => testStore.set('PASSWORD123!')).toThrow('Password must contain lowercase letter');
      expect(() => testStore.set('Password!')).toThrow('Password must contain number');
      expect(() => testStore.set('Password123')).toThrow('Password must contain special character');
    });
  });

  describe('Performance', () => {
    it('should handle frequent validation calls', () => {
      const validator = (value: number) => ({
        isValid: value >= 0 && value <= 1000,
        error: 'Value must be between 0 and 1000'
      });
      
      const testStore = store(0, [validate(validator)]);
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        testStore.set(i);
      }
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
      expect(testStore.get()).toBe(999);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const nullValidator = (value: string | null) => ({
        isValid: value !== null,
        error: 'Value cannot be null'
      });
      
      const testStore = store<string | null>('initial', [validate(nullValidator)]);
      
      expect(() => testStore.set(null)).toThrow('Value cannot be null');
    });

    it('should handle undefined values', () => {
      const undefinedValidator = (value: string | undefined) => ({
        isValid: value !== undefined,
        error: 'Value cannot be undefined'
      });
      
      const testStore = store<string | undefined>('initial', [validate(undefinedValidator)]);
      
      expect(() => testStore.set(undefined)).toThrow('Value cannot be undefined');
    });

    it('should handle boolean values', () => {
      const boolValidator = (value: boolean) => ({
        isValid: value === true,
        error: 'Value must be true'
      });
      
      const testStore = store(true, [validate(boolValidator)]);
      
      expect(() => testStore.set(false)).toThrow('Value must be true');
    });
  });
});