// React integration benchmark: re-render optimization
const { createSafeBenchmark, runBenchmarkSuite } = require('./setup');

// Import React testing utilities
let React, ReactDOM, renderHook, act, cleanup;

try {
  React = require('react');
  ReactDOM = require('react-dom/client');
  const testingLibrary = require('@testing-library/react');
  renderHook = testingLibrary.renderHook;
  act = testingLibrary.act;
  cleanup = testingLibrary.cleanup;
} catch (error) {
  console.error('React testing libraries not available:', error);
  console.log('Skipping React integration benchmarks...');
  module.exports = { runReactIntegrationBenchmarks: async () => null };
  return;
}

// Import state management libraries
let reactPouch, zustand, jotai, valtio;

try {
  reactPouch = require('../src/index');
} catch (error) {
  try {
    reactPouch = require('../dist/index');
  } catch (distError) {
    console.error('React Pouch not available for React benchmarks');
    reactPouch = null;
  }
}

try {
  zustand = require('zustand');
} catch (error) {
  zustand = null;
}

try {
  jotai = require('jotai');
} catch (error) {
  jotai = null;
}

try {
  valtio = require('valtio');
} catch (error) {
  valtio = null;
}

// Create React integration benchmarks
function createReactIntegrationBenchmarks() {
  const benchmarks = [];
  
  // React Pouch hook benchmark
  if (reactPouch) {
    benchmarks.push(
      createSafeBenchmark(
        'React Pouch - Hook Updates',
        function() {
          act(() => {
            this.pouch.set(Math.random());
          });
          this.result.current;
        },
        function() {
          this.pouch = reactPouch.pouch(0);
          this.result = renderHook(() => reactPouch.usePouch(this.pouch));
        },
        function() {
          cleanup();
        }
      )
    );
  }
  
  // Zustand hook benchmark
  if (zustand) {
    benchmarks.push(
      createSafeBenchmark(
        'Zustand - Hook Updates',
        function() {
          act(() => {
            this.store.setState({ value: Math.random() });
          });
          this.result.current;
        },
        function() {
          this.store = zustand.create((set) => ({
            value: 0,
            setValue: (value) => set({ value })
          }));
          this.result = renderHook(() => this.store(state => state.value));
        },
        function() {
          cleanup();
        }
      )
    );
  }
  
  // Jotai hook benchmark
  if (jotai) {
    benchmarks.push(
      createSafeBenchmark(
        'Jotai - Hook Updates',
        function() {
          act(() => {
            this.result.current[1](Math.random());
          });
          this.result.current[0];
        },
        function() {
          this.atom = jotai.atom(0);
          this.result = renderHook(() => jotai.useAtom(this.atom));
        },
        function() {
          cleanup();
        }
      )
    );
  }
  
  // Valtio hook benchmark
  if (valtio) {
    benchmarks.push(
      createSafeBenchmark(
        'Valtio - Hook Updates',
        function() {
          act(() => {
            this.state.value = Math.random();
          });
          this.result.current;
        },
        function() {
          this.state = valtio.proxy({ value: 0 });
          this.result = renderHook(() => valtio.useSnapshot(this.state));
        },
        function() {
          cleanup();
        }
      )
    );
  }
  
  return benchmarks;
}

// Component re-render counting test
function createReRenderBenchmarks() {
  const benchmarks = [];
  
  // React Pouch re-render test
  if (reactPouch) {
    benchmarks.push(
      createSafeBenchmark(
        'React Pouch - Re-render Count',
        function() {
          // Simulate multiple state updates
          for (let i = 0; i < 10; i++) {
            act(() => {
              this.pouch.set(i);
            });
          }
          return this.renderCount;
        },
        function() {
          this.pouch = reactPouch.pouch(0);
          this.renderCount = 0;
          this.result = renderHook(() => {
            this.renderCount++;
            return reactPouch.usePouch(this.pouch);
          });
        },
        function() {
          cleanup();
        }
      )
    );
  }
  
  return benchmarks;
}

// Run React integration benchmarks
async function runReactIntegrationBenchmarks() {
  try {
    console.log('\n=== React Integration Benchmarks ===');
    
    const hookBenchmarks = createReactIntegrationBenchmarks();
    const reRenderBenchmarks = createReRenderBenchmarks();
    
    if (hookBenchmarks.length === 0 && reRenderBenchmarks.length === 0) {
      console.log('No React integration benchmarks available - skipping');
      return null;
    }
    
    const results = {};
    
    if (hookBenchmarks.length > 0) {
      try {
        results.hooks = await runBenchmarkSuite('React Hook Updates', hookBenchmarks);
      } catch (error) {
        console.error('Hook benchmarks failed:', error);
        // Try to fix React testing environment
        if (error.message.includes('document is not defined')) {
          console.log('Setting up JSDOM environment...');
          require('jsdom-global')();
        }
      }
    }
    
    if (reRenderBenchmarks.length > 0) {
      try {
        results.rerenders = await runBenchmarkSuite('Re-render Optimization', reRenderBenchmarks);
      } catch (error) {
        console.error('Re-render benchmarks failed:', error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('React integration benchmarks failed:', error);
    return null;
  }
}

module.exports = { runReactIntegrationBenchmarks };

// Run if called directly
if (require.main === module) {
  runReactIntegrationBenchmarks()
    .then(results => {
      if (results) {
        console.log('\n=== React Integration Results ===');
        console.log(results);
      }
    })
    .catch(error => {
      console.error('React integration benchmark execution failed:', error);
      process.exit(1);
    });
}