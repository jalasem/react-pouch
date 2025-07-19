import type { Plugin, Pouch } from "../core/types";

// Define the augmentation interface for the history plugin
export interface HistoryAugmentation<T> {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  history: {
    past: T[];
    future: T[];
  };
}

interface HistoryPouch<T> extends Pouch<T> {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  history: {
    past: T[];
    future: T[];
  };
}

export function history<T>(maxSize: number = 10): Plugin<T, HistoryAugmentation<T>> {
  const past: T[] = [];
  const future: T[] = [];
  let isUndoRedoing = false;

  return {
    setup(pouch: Pouch<T>) {
      const historyPouch = pouch as HistoryPouch<T>;
      const originalSet = pouch.set.bind(pouch);

      historyPouch.undo = () => {
        if (past.length > 0) {
          const current = pouch.get();
          const previous = past.pop()!;
          future.unshift(current);
          
          isUndoRedoing = true;
          originalSet(previous);
          isUndoRedoing = false;
        }
      };

      historyPouch.redo = () => {
        if (future.length > 0) {
          const current = pouch.get();
          const next = future.shift()!;
          past.push(current);
          
          isUndoRedoing = true;
          originalSet(next);
          isUndoRedoing = false;
        }
      };

      historyPouch.canUndo = () => past.length > 0;
      historyPouch.canRedo = () => future.length > 0;
      historyPouch.history = { past, future };
    },

    onSet(newValue: T, oldValue: T): void {
      if (!isUndoRedoing) {
        past.push(oldValue);
        if (past.length > maxSize) past.shift();
        future.length = 0;
      }
    },
  };
}
