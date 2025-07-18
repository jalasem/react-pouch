import type { Plugin, Store } from "../core/types";

type Middleware<T> = (value: T, oldValue: T) => T;

export function middleware<T>(...middlewares: Middleware<T>[]): Plugin<T> {
  return {
    setup(store: Store<T>) {
      const originalSet = store.set.bind(store);

      store.set = (newValue: T | ((current: T) => T)) => {
        let value =
          typeof newValue === "function"
            ? (newValue as any)(store.get())
            : newValue;

        const oldValue = store.get();

        for (const mw of middlewares) {
          value = mw(value, oldValue);
        }

        originalSet(value);
      };
    },
  };
}
