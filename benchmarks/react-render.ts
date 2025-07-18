import React from 'react';
import { render, act } from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import { useAtom, Provider as JotaiProvider } from 'jotai';
import { useSnapshot } from 'valtio';
import { Bench } from 'tinybench';
import {
  createReactPouch,
  createZustandStore,
  createJotaiStore,
  createReduxStore,
  createValtioStore,
  initialState,
  generateRandomTodos,
  type AppState
} from './setup';

// React Pouch Component
const ReactPouchComponent: React.FC<{ store: ReturnType<typeof createReactPouch> }> = ({ store }) => {
  const state = store.use();
  return <div>{state.todos.length}</div>;
};

// Zustand Component
const ZustandComponent: React.FC<{ store: ReturnType<typeof createZustandStore> }> = ({ store }) => {
  const state = store();
  return <div>{state.todos.length}</div>;
};

// Jotai Component
const JotaiComponent: React.FC<{ stateAtom: any }> = ({ stateAtom }) => {
  const [state] = useAtom(stateAtom);
  return <div>{state.todos.length}</div>;
};

// Redux Component
const ReduxComponent: React.FC = () => {
  const todos = useSelector((state: any) => state.app.todos);
  return <div>{todos.length}</div>;
};

// Valtio Component
const ValtioComponent: React.FC<{ store: ReturnType<typeof createValtioStore> }> = ({ store }) => {
  const state = useSnapshot(store);
  return <div>{state.todos.length}</div>;
};

export async function runReactRenderBenchmarks() {
  console.log('\n⚛️ Running React Render Benchmarks...\n');

  const bench = new Bench({ time: 1000 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Initial render benchmarks
  bench
    .add('React Pouch - Initial Render', () => {
      const { unmount } = render(<ReactPouchComponent store={reactPouch} />);
      unmount();
    })
    .add('Zustand - Initial Render', () => {
      const { unmount } = render(<ZustandComponent store={zustandStore} />);
      unmount();
    })
    .add('Jotai - Initial Render', () => {
      const { unmount } = render(
        <JotaiProvider store={jotaiStore}>
          <JotaiComponent stateAtom={stateAtom} />
        </JotaiProvider>
      );
      unmount();
    })
    .add('Redux - Initial Render', () => {
      const { unmount } = render(
        <Provider store={reduxStore}>
          <ReduxComponent />
        </Provider>
      );
      unmount();
    })
    .add('Valtio - Initial Render', () => {
      const { unmount } = render(<ValtioComponent store={valtioStore} />);
      unmount();
    });

  await bench.run();

  console.log('React Initial Render Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runReactUpdateBenchmarks() {
  console.log('\n🔄 Running React Update Benchmarks...\n');

  const bench = new Bench({ time: 500 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore, actions } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Create rendered components
  const reactPouchRender = render(<ReactPouchComponent store={reactPouch} />);
  const zustandRender = render(<ZustandComponent store={zustandStore} />);
  const jotaiRender = render(
    <JotaiProvider store={jotaiStore}>
      <JotaiComponent stateAtom={stateAtom} />
    </JotaiProvider>
  );
  const reduxRender = render(
    <Provider store={reduxStore}>
      <ReduxComponent />
    </Provider>
  );
  const valtioRender = render(<ValtioComponent store={valtioStore} />);

  // Update benchmarks
  bench
    .add('React Pouch - Update Component', () => {
      act(() => {
        reactPouch.set(state => ({ ...state, todos: generateRandomTodos(5) }));
      });
    })
    .add('Zustand - Update Component', () => {
      act(() => {
        zustandStore.getState().updateTodos(generateRandomTodos(5));
      });
    })
    .add('Jotai - Update Component', () => {
      act(() => {
        jotaiStore.set(stateAtom, state => ({ ...state, todos: generateRandomTodos(5) }));
      });
    })
    .add('Redux - Update Component', () => {
      act(() => {
        reduxStore.dispatch(actions.updateTodos(generateRandomTodos(5)));
      });
    })
    .add('Valtio - Update Component', () => {
      act(() => {
        valtioStore.todos = generateRandomTodos(5);
      });
    });

  await bench.run();

  // Clean up
  reactPouchRender.unmount();
  zustandRender.unmount();
  jotaiRender.unmount();
  reduxRender.unmount();
  valtioRender.unmount();

  console.log('React Update Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

export async function runMultipleComponentsBenchmarks() {
  console.log('\n📊 Running Multiple Components Benchmarks...\n');

  const bench = new Bench({ time: 500 });

  // Setup stores
  const reactPouch = createReactPouch(initialState);
  const zustandStore = createZustandStore(initialState);
  const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
  const { store: reduxStore, actions } = createReduxStore(initialState);
  const valtioStore = createValtioStore(initialState);

  // Components that render multiple children
  const MultipleReactPouchComponents = () => (
    <div>
      {Array.from({ length: 10 }, (_, i) => (
        <ReactPouchComponent key={i} store={reactPouch} />
      ))}
    </div>
  );

  const MultipleZustandComponents = () => (
    <div>
      {Array.from({ length: 10 }, (_, i) => (
        <ZustandComponent key={i} store={zustandStore} />
      ))}
    </div>
  );

  const MultipleJotaiComponents = () => (
    <JotaiProvider store={jotaiStore}>
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <JotaiComponent key={i} stateAtom={stateAtom} />
        ))}
      </div>
    </JotaiProvider>
  );

  const MultipleReduxComponents = () => (
    <Provider store={reduxStore}>
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <ReduxComponent key={i} />
        ))}
      </div>
    </Provider>
  );

  const MultipleValtioComponents = () => (
    <div>
      {Array.from({ length: 10 }, (_, i) => (
        <ValtioComponent key={i} store={valtioStore} />
      ))}
    </div>
  );

  // Multiple component render benchmarks
  bench
    .add('React Pouch - 10 Components Render', () => {
      const { unmount } = render(<MultipleReactPouchComponents />);
      unmount();
    })
    .add('Zustand - 10 Components Render', () => {
      const { unmount } = render(<MultipleZustandComponents />);
      unmount();
    })
    .add('Jotai - 10 Components Render', () => {
      const { unmount } = render(<MultipleJotaiComponents />);
      unmount();
    })
    .add('Redux - 10 Components Render', () => {
      const { unmount } = render(<MultipleReduxComponents />);
      unmount();
    })
    .add('Valtio - 10 Components Render', () => {
      const { unmount } = render(<MultipleValtioComponents />);
      unmount();
    });

  await bench.run();

  console.log('Multiple Components Render Results:');
  console.table(bench.results.map(result => ({
    'Library': result.name || 'Unknown',
    'Ops/sec': result.hz ? Math.round(result.hz).toLocaleString() : 'N/A',
    'Average (ms)': result.mean ? (result.mean * 1000).toFixed(4) : 'N/A',
    'Margin': result.rme ? `±${result.rme.toFixed(2)}%` : 'N/A'
  })));

  return bench.results;
}

