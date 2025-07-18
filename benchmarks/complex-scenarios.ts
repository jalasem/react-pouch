import { Bench } from 'tinybench';
import { create } from 'zustand';
import { createSlice, configureStore } from '@reduxjs/toolkit';
import {
  createReactPouch,
  createZustandStore,
  createJotaiStore,
  createReduxStore,
  createValtioStore,
  initialState,
  generateRandomTodos,
  generateRandomUser,
  type AppState,
  type TodoItem
} from './setup';

// Complex nested update scenarios
export async function runComplexUpdateBenchmarks() {
  console.log('\n🔄 Running Complex Update Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore, actions } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Complex nested updates
  bench
    .add('React Pouch - Complex Nested Update', () => {
      reactPouch.set(state => ({
        ...state,
        todos: state.todos.map(todo => 
          todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
        ),
        user: { ...state.user, name: `Updated ${Date.now()}` },
        settings: { ...state.settings, theme: state.settings.theme === 'light' ? 'dark' : 'light' }
      }));
    })
    .add('Zustand - Complex Nested Update', () => {
      const state = zustandStore.getState();
      zustandStore.setState({
        todos: state.todos.map(todo => 
          todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
        ),
        user: { ...state.user, name: `Updated ${Date.now()}` },
        settings: { ...state.settings, theme: state.settings.theme === 'light' ? 'dark' : 'light' }
      });
    })
    .add('Jotai - Complex Nested Update', () => {
      jotaiStore.set(stateAtom, state => ({
        ...state,
        todos: state.todos.map(todo => 
          todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
        ),
        user: { ...state.user, name: `Updated ${Date.now()}` },
        settings: { ...state.settings, theme: state.settings.theme === 'light' ? 'dark' : 'light' }
      }));
    })
    .add('Redux - Complex Nested Update', () => {
      const state = reduxStore.getState();
      reduxStore.dispatch(actions.updateTodos(
        state.app.todos.map(todo => 
          todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
        )
      ));
      reduxStore.dispatch(actions.updateUser({ name: `Updated ${Date.now()}` }));
      reduxStore.dispatch(actions.updateSettings({ 
        theme: state.app.settings.theme === 'light' ? 'dark' : 'light' 
      }));
    })
    .add('Valtio - Complex Nested Update', () => {
      const todo = valtioStore.todos.find(t => t.id === 1);
      if (todo) {
        todo.completed = !todo.completed;
      }
      valtioStore.user.name = `Updated ${Date.now()}`;
      valtioStore.settings.theme = valtioStore.settings.theme === 'light' ? 'dark' : 'light';
    });

  await bench.run();

  console.log('Complex Update Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runBatchUpdateBenchmarks() {
  console.log('\n📦 Running Batch Update Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore, actions } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Batch updates
  const batchUpdates = () => {
    const newTodos = generateRandomTodos(5);
    const newUser = generateRandomUser();
    const newSettings = { theme: 'dark' as const, notifications: false };
    
    return { newTodos, newUser, newSettings };
  };

  bench
    .add('React Pouch - Batch Updates', () => {
      const { newTodos, newUser, newSettings } = batchUpdates();
      reactPouch.set(state => ({
        ...state,
        todos: newTodos,
        user: { ...state.user, ...newUser },
        settings: { ...state.settings, ...newSettings }
      }));
    })
    .add('Zustand - Batch Updates', () => {
      const { newTodos, newUser, newSettings } = batchUpdates();
      zustandStore.setState(state => ({
        ...state,
        todos: newTodos,
        user: { ...state.user, ...newUser },
        settings: { ...state.settings, ...newSettings }
      }));
    })
    .add('Jotai - Batch Updates', () => {
      const { newTodos, newUser, newSettings } = batchUpdates();
      jotaiStore.set(stateAtom, state => ({
        ...state,
        todos: newTodos,
        user: { ...state.user, ...newUser },
        settings: { ...state.settings, ...newSettings }
      }));
    })
    .add('Redux - Batch Updates', () => {
      const { newTodos, newUser, newSettings } = batchUpdates();
      reduxStore.dispatch(actions.updateTodos(newTodos));
      reduxStore.dispatch(actions.updateUser(newUser));
      reduxStore.dispatch(actions.updateSettings(newSettings));
    })
    .add('Valtio - Batch Updates', () => {
      const { newTodos, newUser, newSettings } = batchUpdates();
      valtioStore.todos = newTodos;
      Object.assign(valtioStore.user, newUser);
      Object.assign(valtioStore.settings, newSettings);
    });

  await bench.run();

  console.log('Batch Update Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runConcurrentUpdateBenchmarks() {
  console.log('\n⚡ Running Concurrent Update Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore, actions } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Concurrent updates simulation
  bench
    .add('React Pouch - Concurrent Updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          reactPouch.set(state => ({
            ...state,
            todos: [...state.todos, { id: i, text: `Concurrent ${i}`, completed: false, createdAt: new Date() }]
          }));
        })
      );
      await Promise.all(promises);
    })
    .add('Zustand - Concurrent Updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          zustandStore.setState(state => ({
            todos: [...state.todos, { id: i, text: `Concurrent ${i}`, completed: false, createdAt: new Date() }]
          }));
        })
      );
      await Promise.all(promises);
    })
    .add('Jotai - Concurrent Updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          jotaiStore.set(stateAtom, state => ({
            ...state,
            todos: [...state.todos, { id: i, text: `Concurrent ${i}`, completed: false, createdAt: new Date() }]
          }));
        })
      );
      await Promise.all(promises);
    })
    .add('Redux - Concurrent Updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          const state = reduxStore.getState();
          reduxStore.dispatch(actions.updateTodos([
            ...state.app.todos, 
            { id: i, text: `Concurrent ${i}`, completed: false, createdAt: new Date() }
          ]));
        })
      );
      await Promise.all(promises);
    })
    .add('Valtio - Concurrent Updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          valtioStore.todos.push({ id: i, text: `Concurrent ${i}`, completed: false, createdAt: new Date() });
        })
      );
      await Promise.all(promises);
    });

  await bench.run();

  console.log('Concurrent Update Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runDeepNestingBenchmarks() {
  console.log('\n🏗️ Running Deep Nesting Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Create deeply nested initial state
  const deepState = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              value: 'deep value',
              array: [1, 2, 3, 4, 5],
              object: { a: 1, b: 2, c: 3 }
            }
          }
        }
      }
    }
  };

  // Setup stores with deep state
  const reactPouch = createReactPouch(deepState);
  const zustandStore = create(() => deepState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(deepState);
  const reduxSlice = createSlice({
    name: 'deep',
    initialState: deepState,
    reducers: {
      updateDeepValue: (state, action) => {
        state.level1.level2.level3.level4.level5.value = action.payload;
      }
    }
  });
  const reduxStore = configureStore({ reducer: { deep: reduxSlice.reducer } });
  const valtioStore = createValtioStore(deepState);

  // Deep nesting updates
  bench
    .add('React Pouch - Deep Nesting Update', () => {
      reactPouch.set(state => ({
        ...state,
        level1: {
          ...state.level1,
          level2: {
            ...state.level1.level2,
            level3: {
              ...state.level1.level2.level3,
              level4: {
                ...state.level1.level2.level3.level4,
                level5: {
                  ...state.level1.level2.level3.level4.level5,
                  value: `updated ${Date.now()}`
                }
              }
            }
          }
        }
      }));
    })
    .add('Zustand - Deep Nesting Update', () => {
      zustandStore.setState(state => ({
        ...state,
        level1: {
          ...state.level1,
          level2: {
            ...state.level1.level2,
            level3: {
              ...state.level1.level2.level3,
              level4: {
                ...state.level1.level2.level3.level4,
                level5: {
                  ...state.level1.level2.level3.level4.level5,
                  value: `updated ${Date.now()}`
                }
              }
            }
          }
        }
      }));
    })
    .add('Jotai - Deep Nesting Update', () => {
      jotaiStore.set(stateAtom, state => ({
        ...state,
        level1: {
          ...state.level1,
          level2: {
            ...state.level1.level2,
            level3: {
              ...state.level1.level2.level3,
              level4: {
                ...state.level1.level2.level3.level4,
                level5: {
                  ...state.level1.level2.level3.level4.level5,
                  value: `updated ${Date.now()}`
                }
              }
            }
          }
        }
      }));
    })
    .add('Redux - Deep Nesting Update', () => {
      reduxStore.dispatch(reduxSlice.actions.updateDeepValue(`updated ${Date.now()}`));
    })
    .add('Valtio - Deep Nesting Update', () => {
      valtioStore.level1.level2.level3.level4.level5.value = `updated ${Date.now()}`;
    });

  await bench.run();

  console.log('Deep Nesting Update Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

