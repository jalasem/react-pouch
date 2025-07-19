import type { Plugin, Pouch } from "../core/types";

// Define the augmentation interface for the computed plugin
export interface ComputedAugmentation<C> {
  computed(): C;
}

export function computed<T, C>(computeFn: (value: T) => C): Plugin<T, ComputedAugmentation<C>> {
  let computedValue: C;

  return {
    setup(pouch: Pouch<T>) {
      computedValue = computeFn(pouch.get());
      (pouch as any).computed = () => computedValue;
    },

    onSet(newValue: T): void {
      computedValue = computeFn(newValue);
    },
  };
}
