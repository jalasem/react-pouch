import type { Plugin } from "../core/types";

interface RNPersistOptions {
  serialize?: (value: any) => string;
  deserialize?: (str: string) => any;
  asyncStorage?: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
}

function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === "object") {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }
    return val;
  });
}

export function rnPersist<T>(key: string, options: RNPersistOptions = {}): Plugin<T> {
  const {
    serialize = safeStringify,
    deserialize = JSON.parse,
    asyncStorage
  } = options;

  // Try to get AsyncStorage from options first, then from @react-native-async-storage/async-storage
  let AsyncStorage = asyncStorage;
  if (!AsyncStorage) {
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      // AsyncStorage not available, plugin will be disabled
      console.warn('rnPersist: AsyncStorage not available. Install @react-native-async-storage/async-storage or provide asyncStorage option.');
    }
  }

  return {
    setup(pouch) {
      // Always add storage info method regardless of AsyncStorage availability
      (pouch as any).getStorageInfo = () => ({
        key,
        available: !!AsyncStorage,
        type: 'AsyncStorage'
      });

      // Add clear method (will be no-op if AsyncStorage not available)
      (pouch as any).clearStorage = async () => {
        if (AsyncStorage) {
          try {
            await AsyncStorage.removeItem(key);
          } catch (error) {
            console.error(`rnPersist: Failed to clear data for key "${key}":`, error);
          }
        }
      };

      if (!AsyncStorage) return;

      // Load data asynchronously after setup
      AsyncStorage.getItem(key)
        .then((stored) => {
          if (stored !== null) {
            try {
              const data = deserialize(stored);
              pouch.set(data);
            } catch (error) {
              console.error(`rnPersist: Failed to parse stored data for key "${key}":`, error);
            }
          }
        })
        .catch((error) => {
          console.error(`rnPersist: Failed to load data for key "${key}":`, error);
        });

      const originalSet = pouch.set.bind(pouch);
      
      pouch.set = (newValue: T | ((current: T) => T)) => {
        const resolvedValue = typeof newValue === 'function' 
          ? (newValue as (current: T) => T)(pouch.get())
          : newValue;

        // Call original set first
        originalSet(newValue);

        // Then persist asynchronously
        try {
          const serialized = serialize(resolvedValue);
          AsyncStorage!.setItem(key, serialized).catch((error) => {
            console.error(`rnPersist: Failed to save data for key "${key}":`, error);
          });
        } catch (error) {
          console.error(`rnPersist: Failed to serialize data for key "${key}":`, error);
        }
      };
    },
  };
}