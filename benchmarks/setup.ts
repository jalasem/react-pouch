import { pouch } from '../src';
import { create } from 'zustand';
import { atom, createStore } from 'jotai';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { proxy } from 'valtio';

// Test data structures
export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface AppState {
  todos: TodoItem[];
  user: {
    id: number;
    name: string;
    email: string;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export const initialState: AppState = {
  todos: [],
  user: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  },
  settings: {
    theme: 'light',
    notifications: true
  }
};

// Create large initial state for performance testing
export const createLargeState = (size: number = 1000): AppState => ({
  ...initialState,
  todos: Array.from({ length: size }, (_, i) => ({
    id: i,
    text: `Todo item ${i}`,
    completed: i % 2 === 0,
    createdAt: new Date().toISOString()
  }))
});

// React Pouch setup
export const createReactPouch = (state: AppState = initialState) => {
  return pouch(state);
};

// Zustand setup
export const createZustandStore = (state: AppState = initialState) => {
  return create<AppState & {
    updateTodos: (todos: TodoItem[]) => void;
    updateUser: (user: Partial<AppState['user']>) => void;
    updateSettings: (settings: Partial<AppState['settings']>) => void;
  }>((set) => ({
    ...state,
    updateTodos: (todos) => set({ todos }),
    updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
    updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  }));
};

// Jotai setup
export const createJotaiStore = (state: AppState = initialState) => {
  const store = createStore();
  const stateAtom = atom(state);
  return { store, stateAtom };
};

// Redux Toolkit setup
export const createReduxStore = (state: AppState = initialState) => {
  const appSlice = createSlice({
    name: 'app',
    initialState: state,
    reducers: {
      updateTodos: (state, action) => {
        state.todos = action.payload;
      },
      updateUser: (state, action) => {
        state.user = { ...state.user, ...action.payload };
      },
      updateSettings: (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      },
    },
  });

  const store = configureStore({
    reducer: {
      app: appSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for benchmarks
      }),
  });

  return { store, actions: appSlice.actions };
};

// Valtio setup
export const createValtioStore = (state: AppState = initialState) => {
  return proxy(state);
};

// Utility functions for benchmarking
export const generateRandomTodos = (count: number): TodoItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: Math.random() * 1000000,
    text: `Random todo ${i}`,
    completed: Math.random() > 0.5,
    createdAt: new Date().toISOString()
  }));
};

export const generateRandomUser = () => ({
  id: Math.random() * 1000000,
  name: `User ${Math.random().toString(36).substr(2, 9)}`,
  email: `user${Math.random().toString(36).substr(2, 5)}@example.com`
});