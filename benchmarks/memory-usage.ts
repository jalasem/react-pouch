import { performance } from 'perf_hooks';
import {
  createReactPouch,
  createZustandStore,
  createJotaiStore,
  createReduxStore,
  createValtioStore,
  initialState,
  createLargeState,
  generateRandomTodos,
  type AppState
} from './setup';

interface MemoryUsageResult {
  library: string;
  initialMemory: number;
  finalMemory: number;
  memoryIncrease: number;
  operationsPerformed: number;
  avgMemoryPerOperation: number;
}

// Memory usage measurement utility
function measureMemoryUsage(): number {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage().heapUsed / 1024 / 1024; // MB
}

// Force garbage collection if available
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

export async function runMemoryUsageBenchmarks() {
  console.log('\n💾 Running Memory Usage Benchmarks...\n');

  const results: MemoryUsageResult[] = [];
  const operationCount = 1000;

  // React Pouch Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createReactPouch(initialState);
    
    for (let i = 0; i < operationCount; i++) {
      store.set(state => ({ ...state, todos: generateRandomTodos(10) }));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'React Pouch',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Zustand Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createZustandStore(initialState);
    
    for (let i = 0; i < operationCount; i++) {
      store.getState().updateTodos(generateRandomTodos(10));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Zustand',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Jotai Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store, stateAtom } = createJotaiStore(initialState);
    
    for (let i = 0; i < operationCount; i++) {
      store.set(stateAtom, state => ({ ...state, todos: generateRandomTodos(10) }));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Jotai',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Redux Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store, actions } = createReduxStore(initialState);
    
    for (let i = 0; i < operationCount; i++) {
      store.dispatch(actions.updateTodos(generateRandomTodos(10)));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Redux Toolkit',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Valtio Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createValtioStore(initialState);
    
    for (let i = 0; i < operationCount; i++) {
      store.todos = generateRandomTodos(10);
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Valtio',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  console.log('Memory Usage Results:');
  console.table(results.map(result => ({
    'Library': result.library,
    'Initial (MB)': result.initialMemory.toFixed(2),
    'Final (MB)': result.finalMemory.toFixed(2),
    'Increase (MB)': result.memoryIncrease.toFixed(2),
    'Avg per Op (KB)': (result.avgMemoryPerOperation * 1024).toFixed(2),
    'Operations': result.operationsPerformed
  })));

  return results;
}

export async function runLargeStateMemoryBenchmarks() {
  console.log('\n🔥 Running Large State Memory Benchmarks...\n');

  const results: MemoryUsageResult[] = [];
  const operationCount = 100;
  const largeState = createLargeState(5000);

  // React Pouch Large State Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createReactPouch(largeState);
    
    for (let i = 0; i < operationCount; i++) {
      store.set(state => ({ ...state, todos: [...state.todos, ...generateRandomTodos(100)] }));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'React Pouch',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Zustand Large State Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createZustandStore(largeState);
    
    for (let i = 0; i < operationCount; i++) {
      const state = store.getState();
      state.updateTodos([...state.todos, ...generateRandomTodos(100)]);
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Zustand',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Jotai Large State Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store, stateAtom } = createJotaiStore(largeState);
    
    for (let i = 0; i < operationCount; i++) {
      store.set(stateAtom, state => ({ ...state, todos: [...state.todos, ...generateRandomTodos(100)] }));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Jotai',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Redux Large State Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store, actions } = createReduxStore(largeState);
    
    for (let i = 0; i < operationCount; i++) {
      const state = store.getState();
      store.dispatch(actions.updateTodos([...state.app.todos, ...generateRandomTodos(100)]));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Redux Toolkit',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  // Valtio Large State Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createValtioStore(largeState);
    
    for (let i = 0; i < operationCount; i++) {
      store.todos.push(...generateRandomTodos(100));
    }
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Valtio',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: operationCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / operationCount
    });
  }

  console.log('Large State Memory Usage Results:');
  console.table(results.map(result => ({
    'Library': result.library,
    'Initial (MB)': result.initialMemory.toFixed(2),
    'Final (MB)': result.finalMemory.toFixed(2),
    'Increase (MB)': result.memoryIncrease.toFixed(2),
    'Avg per Op (KB)': (result.avgMemoryPerOperation * 1024).toFixed(2),
    'Operations': result.operationsPerformed
  })));

  return results;
}

export async function runSubscriptionMemoryBenchmarks() {
  console.log('\n📡 Running Subscription Memory Benchmarks...\n');

  const results: MemoryUsageResult[] = [];
  const subscriptionCount = 1000;

  // React Pouch Subscription Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createReactPouch(initialState);
    const unsubscribes: Array<() => void> = [];
    
    for (let i = 0; i < subscriptionCount; i++) {
      const unsubscribe = store.subscribe(() => {});
      unsubscribes.push(unsubscribe);
    }
    
    // Clean up subscriptions
    unsubscribes.forEach(unsub => unsub());
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'React Pouch',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: subscriptionCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / subscriptionCount
    });
  }

  // Zustand Subscription Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const store = createZustandStore(initialState);
    const unsubscribes: Array<() => void> = [];
    
    for (let i = 0; i < subscriptionCount; i++) {
      const unsubscribe = store.subscribe(() => {});
      unsubscribes.push(unsubscribe);
    }
    
    // Clean up subscriptions
    unsubscribes.forEach(unsub => unsub());
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Zustand',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: subscriptionCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / subscriptionCount
    });
  }

  // Jotai Subscription Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store, stateAtom } = createJotaiStore(initialState);
    const unsubscribes: Array<() => void> = [];
    
    for (let i = 0; i < subscriptionCount; i++) {
      const unsubscribe = store.sub(stateAtom, () => {});
      unsubscribes.push(unsubscribe);
    }
    
    // Clean up subscriptions
    unsubscribes.forEach(unsub => unsub());
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Jotai',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: subscriptionCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / subscriptionCount
    });
  }

  // Redux Subscription Memory Test
  {
    forceGC();
    const initialMemory = measureMemoryUsage();
    const { store } = createReduxStore(initialState);
    const unsubscribes: Array<() => void> = [];
    
    for (let i = 0; i < subscriptionCount; i++) {
      const unsubscribe = store.subscribe(() => {});
      unsubscribes.push(unsubscribe);
    }
    
    // Clean up subscriptions
    unsubscribes.forEach(unsub => unsub());
    
    const finalMemory = measureMemoryUsage();
    results.push({
      library: 'Redux Toolkit',
      initialMemory,
      finalMemory,
      memoryIncrease: finalMemory - initialMemory,
      operationsPerformed: subscriptionCount,
      avgMemoryPerOperation: (finalMemory - initialMemory) / subscriptionCount
    });
  }

  console.log('Subscription Memory Usage Results:');
  console.table(results.map(result => ({
    'Library': result.library,
    'Initial (MB)': result.initialMemory.toFixed(2),
    'Final (MB)': result.finalMemory.toFixed(2),
    'Increase (MB)': result.memoryIncrease.toFixed(2),
    'Avg per Op (KB)': (result.avgMemoryPerOperation * 1024).toFixed(2),
    'Subscriptions': result.operationsPerformed
  })));

  return results;
}