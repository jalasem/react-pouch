import type { Plugin } from "../core/types";

type Validator<T> = (value: T) => { isValid: boolean; error?: string };

export function validate<T>(validator: Validator<T>): Plugin<T> {
  return {
    setup(pouch) {
      const originalSet = pouch.set.bind(pouch);
      
      pouch.set = (newValue: T | ((current: T) => T)) => {
        const resolvedValue = typeof newValue === 'function' 
          ? (newValue as (current: T) => T)(pouch.get())
          : newValue;
          
        const validation = validator(resolvedValue);
        if (!validation.isValid) {
          throw new Error(validation.error || "Validation failed");
        }
        
        originalSet(newValue);
      };
    },
  };
}
