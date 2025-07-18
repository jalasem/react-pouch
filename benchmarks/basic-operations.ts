import * as Benchmark from 'benchmark';
import {
  createReactPouch,
  createZustandStore,
  createJotaiStore,
  createReduxStore,
  createValtioStore,
  initialState,
  createLargeState,
  generateRandomTodos,
  generateRandomUser,
  type AppState
} from './setup';

export async function runBasicOperationsBenchmarks() {
  console.log('\n🚀 Running Basic Operations Benchmarks...\n');

  return new Promise((resolve) => {
    const suite = new Benchmark.Suite();
    const results: any[] = [];

    // Setup stores
    const reactPouch = createReactPouch(initialState);
    const zustandStore = createZustandStore(initialState);
    const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
    const { store: reduxStore, actions } = createReduxStore(initialState);
    const valtioStore = createValtioStore(initialState);

    // Basic get operations
    suite
      .add('React Pouch - Get State', () => {
        reactPouch.get();
      })
      .add('Zustand - Get State', () => {
        zustandStore.getState();
      })
      .add('Jotai - Get State', () => {
        jotaiStore.get(stateAtom);
      })
      .add('Redux - Get State', () => {
        reduxStore.getState();
      })
      .add('Valtio - Get State', () => {
        valtioStore.todos.length; // Access property to trigger getter
      });

    // Basic set operations
    const newTodos = generateRandomTodos(10);
    
    suite
      .add('React Pouch - Set Todos', () => {
        reactPouch.set(state => ({ ...state, todos: newTodos }));
      })
      .add('Zustand - Set Todos', () => {
        zustandStore.getState().updateTodos(newTodos);
      })
      .add('Jotai - Set Todos', () => {
        jotaiStore.set(stateAtom, state => ({ ...state, todos: newTodos }));
      })
      .add('Redux - Set Todos', () => {
        reduxStore.dispatch(actions.updateTodos(newTodos));
      })
      .add('Valtio - Set Todos', () => {
        valtioStore.todos = newTodos;
      });

    // Nested updates
    const newUser = generateRandomUser();
    
    suite
      .add('React Pouch - Update User', () => {
        reactPouch.set(state => ({ ...state, user: { ...state.user, ...newUser } }));
      })
      .add('Zustand - Update User', () => {
        zustandStore.getState().updateUser(newUser);
      })
      .add('Jotai - Update User', () => {
        jotaiStore.set(stateAtom, state => ({ ...state, user: { ...state.user, ...newUser } }));
      })
      .add('Redux - Update User', () => {
        reduxStore.dispatch(actions.updateUser(newUser));
      })
      .add('Valtio - Update User', () => {
        Object.assign(valtioStore.user, newUser);
      });

    suite
      .on('cycle', (event: any) => {
        console.log(String(event.target));
        results.push({
          name: event.target.name,
          hz: event.target.hz,
          mean: event.target.stats.mean,
          rme: event.target.stats.rme
        });
      })
      .on('complete', () => {
        console.log('\nBasic Operations Results:');
        console.table(results.map(result => ({
          'Library': result.name || 'Unknown',
          'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
          'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
          'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
        })));
        resolve(results);
      })
      .run({ async: true });
  });
}

export async function runLargeStateOperationsBenchmarks() {
  console.log('\n🔥 Running Large State Operations Benchmarks...\n');

  const bench = new Bench({ time: 1000 });
  const largeState = createLargeState(5000);

  // Setup stores with large initial state
  const reactPouch = createReactPouch(largeState);
  const zustandStore = createZustandStore(largeState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(largeState);
  const { store: reduxStore, actions } = createReduxStore(largeState);
  const valtioStore = createValtioStore(largeState);

  // Large state read operations
  bench
    .add('React Pouch - Read Large State', () => {
      const state = reactPouch.get();
      return state.todos.length;
    })
    .add('Zustand - Read Large State', () => {
      const state = zustandStore.getState();
      return state.todos.length;
    })
    .add('Jotai - Read Large State', () => {
      const state = jotaiStore.get(stateAtom);
      return state.todos.length;
    })
    .add('Redux - Read Large State', () => {
      const state = reduxStore.getState();
      return state.app.todos.length;
    })
    .add('Valtio - Read Large State', () => {
      return valtioStore.todos.length;
    });

  // Large state update operations
  const newTodos = generateRandomTodos(1000);
  
  bench
    .add('React Pouch - Update Large State', () => {
      reactPouch.set(state => ({ ...state, todos: [...state.todos, ...newTodos] }));
    })
    .add('Zustand - Update Large State', () => {
      const state = zustandStore.getState();
      state.updateTodos([...state.todos, ...newTodos]);
    })
    .add('Jotai - Update Large State', () => {
      jotaiStore.set(stateAtom, state => ({ ...state, todos: [...state.todos, ...newTodos] }));
    })
    .add('Redux - Update Large State', () => {
      const state = reduxStore.getState();
      reduxStore.dispatch(actions.updateTodos([...state.app.todos, ...newTodos]));
    })
    .add('Valtio - Update Large State', () => {
      valtioStore.todos.push(...newTodos);
    });

  await bench.run();

  console.log('Large State Operations Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runSubscriptionBenchmarks() {
  console.log('\n📡 Running Subscription Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Subscription/unsubscription operations
  bench
    .add('React Pouch - Subscribe/Unsubscribe', () => {
      const unsubscribe = reactPouch.subscribe(() => {});
      unsubscribe();
    })
    .add('Zustand - Subscribe/Unsubscribe', () => {
      const unsubscribe = zustandStore.subscribe(() => {});
      unsubscribe();
    })
    .add('Jotai - Subscribe/Unsubscribe', () => {
      const unsubscribe = jotaiStore.sub(stateAtom, () => {});
      unsubscribe();
    })
    .add('Redux - Subscribe/Unsubscribe', () => {
      const unsubscribe = reduxStore.subscribe(() => {});
      unsubscribe();
    });

  await bench.run();

  console.log('Subscription Operations Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}