// Basic operations benchmark: get/set performance
const { createSafeBenchmark, runBenchmarkSuite, measureMemoryUsage } = require('./setup');

// Import state management libraries
let reactPouch, zustand, jotai, valtio, reduxToolkit;

try {
  reactPouch = require('../src/index');
} catch (error) {
  console.error('Failed to import react-pouch:', error);
  console.log('Attempting to import from built dist...');
  try {
    reactPouch = require('../dist/index');
  } catch (distError) {
    console.error('Failed to import from dist:', distError);
    console.log('Building react-pouch first...');
    require('child_process').execSync('npm run build', { stdio: 'inherit' });
    reactPouch = require('../dist/index');
  }
}

try {
  zustand = require('zustand');
} catch (error) {
  console.error('Zustand not available:', error);
  zustand = null;
}

try {
  jotai = require('jotai');
} catch (error) {
  console.error('Jotai not available:', error);
  jotai = null;
}

try {
  valtio = require('valtio');
} catch (error) {
  console.error('Valtio not available:', error);
  valtio = null;
}

try {
  reduxToolkit = require('@reduxjs/toolkit');
} catch (error) {
  console.error('Redux Toolkit not available:', error);
  reduxToolkit = null;
}

// Create benchmark functions with error handling
function createBasicOperationsBenchmarks() {
  const benchmarks = [];
  
  // React Pouch benchmarks
  if (reactPouch) {
    benchmarks.push(
      createSafeBenchmark(
        'React Pouch - Basic Set/Get',
        function() {
          this.pouch.set(Math.random());
          this.pouch.get();
        },
        function() {
          const { pouch } = require('../dist/index');
          this.pouch = pouch(0);
        }
      )
    );
  }
  
  // Zustand benchmarks
  if (zustand) {
    benchmarks.push(
      createSafeBenchmark(
        'Zustand - Basic Set/Get',
        function() {
          this.store.setState({ value: Math.random() });
          this.store.getState();
        },
        function() {
          this.store = zustand.create((set, get) => ({
            value: 0,
            setState: set,
            getState: get
          }));
        }
      )
    );
  }
  
  // Jotai benchmarks
  if (jotai) {
    benchmarks.push(
      createSafeBenchmark(
        'Jotai - Basic Set/Get',
        function() {
          this.store.set(this.atom, Math.random());
          this.store.get(this.atom);
        },
        function() {
          this.atom = jotai.atom(0);
          this.store = jotai.createStore();
        }
      )
    );
  }
  
  // Valtio benchmarks
  if (valtio) {
    benchmarks.push(
      createSafeBenchmark(
        'Valtio - Basic Set/Get',
        function() {
          this.state.value = Math.random();
          const value = this.state.value;
        },
        function() {
          this.state = valtio.proxy({ value: 0 });
        }
      )
    );
  }
  
  // Redux Toolkit benchmarks
  if (reduxToolkit) {
    benchmarks.push(
      createSafeBenchmark(
        'Redux Toolkit - Basic Set/Get',
        function() {
          this.store.dispatch(this.actions.setValue(Math.random()));
          this.store.getState();
        },
        function() {
          const slice = reduxToolkit.createSlice({
            name: 'test',
            initialState: { value: 0 },
            reducers: {
              setValue: (state, action) => {
                state.value = action.payload;
              }
            }
          });
          this.actions = slice.actions;
          this.store = reduxToolkit.configureStore({
            reducer: slice.reducer
          });
        }
      )
    );
  }
  
  return benchmarks;
}

// Memory usage tests
function runMemoryTests() {
  const results = {};
  
  console.log('\n=== Memory Usage Tests ===');
  
  // React Pouch memory test
  if (reactPouch) {
    try {
      const memoryUsage = measureMemoryUsage(() => {
        const pouch = reactPouch.pouch(Math.random());
        pouch.set(Math.random());
        pouch.get();
      }, 1000);
      results['React Pouch'] = memoryUsage;
      console.log('React Pouch Memory:', memoryUsage);
    } catch (error) {
      console.error('React Pouch memory test failed:', error);
    }
  }
  
  // Zustand memory test
  if (zustand) {
    try {
      const memoryUsage = measureMemoryUsage(() => {
        const store = zustand.create((set, get) => ({
          value: Math.random(),
          setState: set,
          getState: get
        }));
        store.setState({ value: Math.random() });
        store.getState();
      }, 1000);
      results['Zustand'] = memoryUsage;
      console.log('Zustand Memory:', memoryUsage);
    } catch (error) {
      console.error('Zustand memory test failed:', error);
    }
  }
  
  return results;
}

// Run benchmarks
async function runBasicOperationsBenchmarks() {
  try {
    console.log('=== Basic Operations Benchmarks ===');
    const benchmarks = createBasicOperationsBenchmarks();
    
    if (benchmarks.length === 0) {
      console.error('No benchmarks available - check library imports');
      return null;
    }
    
    const results = await runBenchmarkSuite('Basic Operations', benchmarks);
    const memoryResults = runMemoryTests();
    
    return {
      performance: results,
      memory: memoryResults
    };
  } catch (error) {
    console.error('Basic operations benchmark failed:', error);
    // Try to diagnose and fix the issue
    if (error.message.includes('Cannot resolve module')) {
      console.log('Module resolution issue - checking dependencies...');
      require('child_process').execSync('npm ls', { stdio: 'inherit' });
    }
    return null;
  }
}

module.exports = { runBasicOperationsBenchmarks };

// Run if called directly
if (require.main === module) {
  runBasicOperationsBenchmarks()
    .then(results => {
      if (results) {
        console.log('\n=== Results Summary ===');
        console.log('Performance:', results.performance);
        console.log('Memory:', results.memory);
      }
    })
    .catch(error => {
      console.error('Benchmark execution failed:', error);
      process.exit(1);
    });
}