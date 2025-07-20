# History Plugin

The history plugin adds undo/redo functionality to your pouch, maintaining a configurable history of state changes. This enables users to navigate through previous states and restore them as needed.

## Import

```typescript
import { history } from 'react-pouch/plugins';
```

## Configuration

```typescript
history(maxSize?: number)  // Default: 10
```

The `maxSize` parameter controls how many previous states to keep in history.

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { history } from 'react-pouch/plugins';

const editorPouch = pouch('Initial text', [
  history(20)  // Keep last 20 states
]);

// Make some changes
editorPouch.set('Hello');
editorPouch.set('Hello World');
editorPouch.set('Hello World!');

// Undo changes
editorPouch.undo(); // Back to 'Hello World'
editorPouch.undo(); // Back to 'Hello'

// Redo changes
editorPouch.redo(); // Forward to 'Hello World'
```

### With Complex State

```typescript
interface DrawingState {
  shapes: Array<{ id: string; type: string; x: number; y: number }>;
  selectedId: string | null;
  color: string;
}

const canvas = pouch<DrawingState>(
  { shapes: [], selectedId: null, color: '#000000' },
  [
    history(50)  // Keep 50 states for drawing app
  ]
);

// Add shapes
canvas.set(state => ({
  ...state,
  shapes: [...state.shapes, { id: '1', type: 'circle', x: 100, y: 100 }]
}));

// Check if we can undo
if (canvas.canUndo()) {
  canvas.undo();
}
```

## API Methods

### `undo(): void`

Reverts to the previous state in history.

```typescript
pouch.undo();
```

### `redo(): void`

Advances to the next state in history (if available after undo).

```typescript
pouch.redo();
```

### `canUndo(): boolean`

Returns true if there are previous states available.

```typescript
if (pouch.canUndo()) {
  pouch.undo();
}
```

### `canRedo(): boolean`

Returns true if there are future states available (after undo).

```typescript
if (pouch.canRedo()) {
  pouch.redo();
}
```

### `history: { past: T[], future: T[] }`

Direct access to the history arrays (read-only recommended).

```typescript
console.log(`History size: ${pouch.history.past.length}`);
console.log(`Redo available: ${pouch.history.future.length}`);
```

## Common Use Cases

### 1. Text Editor with Undo/Redo

```typescript
const TextEditor = () => {
  const editor = useMemo(() => 
    pouch({ content: '', cursorPosition: 0 }, [
      history(100),
      debounce(500)  // Debounce to avoid too many history entries
    ]), 
    []
  );
  
  const [state] = editor.use();
  
  return (
    <div>
      <div>
        <button 
          onClick={() => editor.undo()} 
          disabled={!editor.canUndo()}
        >
          Undo
        </button>
        <button 
          onClick={() => editor.redo()} 
          disabled={!editor.canRedo()}
        >
          Redo
        </button>
      </div>
      <textarea
        value={state.content}
        onChange={(e) => editor.set({ 
          content: e.target.value, 
          cursorPosition: e.target.selectionStart 
        })}
      />
    </div>
  );
};
```

### 2. Drawing Application

```typescript
interface DrawCommand {
  id: string;
  type: 'draw' | 'erase' | 'move';
  data: any;
  timestamp: number;
}

const drawingApp = pouch<DrawCommand[]>([], [
  history(200),  // Generous history for art application
  persist('drawing-autosave')
]);

// Add keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey && drawingApp.canUndo()) {
        e.preventDefault();
        drawingApp.undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (drawingApp.canRedo()) {
          e.preventDefault();
          drawingApp.redo();
        }
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### 3. Form with Step Navigation

```typescript
interface FormData {
  step: number;
  personalInfo: { name: string; email: string };
  addressInfo: { street: string; city: string };
  paymentInfo: { method: string; details: any };
}

const multiStepForm = pouch<FormData>(
  {
    step: 1,
    personalInfo: { name: '', email: '' },
    addressInfo: { street: '', city: '' },
    paymentInfo: { method: '', details: {} }
  },
  [
    history(10),
    validate((data) => {
      // Validate current step
      switch (data.step) {
        case 1:
          return {
            isValid: data.personalInfo.name && data.personalInfo.email,
            error: 'Please fill in all personal information'
          };
        // ... more validation
      }
      return { isValid: true };
    })
  ]
);

// Navigation functions
const goBack = () => {
  if (multiStepForm.canUndo()) {
    multiStepForm.undo();
  }
};

const goForward = () => {
  if (multiStepForm.canRedo()) {
    multiStepForm.redo();
  } else {
    // Move to next step
    multiStepForm.set(state => ({ ...state, step: state.step + 1 }));
  }
};
```

### 4. Game State Management

```typescript
interface GameState {
  board: string[][];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  moveCount: number;
}

const ticTacToe = pouch<GameState>(
  {
    board: Array(3).fill(Array(3).fill('')),
    currentPlayer: 'X',
    winner: null,
    moveCount: 0
  },
  [
    history(9),  // Maximum possible moves
    computed((state) => {
      // Check for winner
      // ... game logic
      return { isGameOver: !!state.winner || state.moveCount === 9 };
    })
  ]
);

// Take back move
const takeBackMove = () => {
  if (ticTacToe.canUndo()) {
    ticTacToe.undo();
  }
};
```

### 5. Configuration Changes

```typescript
interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  fontSize: number;
}

const settings = pouch<AppConfig>(
  { theme: 'auto', language: 'en', notifications: true, fontSize: 16 },
  [
    history(20),
    persist('app-settings'),
    logger('Settings')
  ]
);

// Preview changes with ability to revert
const previewTheme = (theme: AppConfig['theme']) => {
  settings.set(state => ({ ...state, theme }));
  
  // Show preview for 5 seconds
  setTimeout(() => {
    if (!confirm('Keep this theme?')) {
      settings.undo();
    }
  }, 5000);
};
```

### 6. Collaborative Editing

```typescript
interface CollaborativeDoc {
  content: string;
  lastEditedBy: string;
  version: number;
}

const sharedDoc = pouch<CollaborativeDoc>(
  { content: '', lastEditedBy: '', version: 1 },
  [
    history(100),
    sync('/api/document/123', {
      onError: (error) => {
        // On sync failure, allow user to revert
        if (confirm('Sync failed. Revert to last synced state?')) {
          sharedDoc.undo();
        }
      }
    })
  ]
);
```

## Notes

- History tracking happens automatically after the history plugin is added
- Making a new change after undoing clears the redo history (future states)
- The `maxSize` parameter prevents unlimited memory growth
- Undo/redo operations bypass other plugin transformations (like validation)
- The history plugin stores deep copies of your state, so be mindful of memory usage with large objects
- History is not persisted by default - combine with `persist` plugin if needed
- The `isUndoRedoing` flag prevents history from recording undo/redo operations themselves
- Consider using `debounce` plugin alongside history to avoid recording every keystroke