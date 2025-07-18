#!/usr/bin/env node
import * as Benchmark from 'benchmark';
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
  generateRandomUser,
  type AppState
} from './setup';

interface BenchmarkResult {
  category: string;
  name: string;
  hz: number;
  mean: number;
  rme: number;
}

class SimpleBenchmarkRunner {
  private results: BenchmarkResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  private runBenchmarkSuite(category: string, setupFn: () => Benchmark.Suite): Promise<BenchmarkResult[]> {
    return new Promise((resolve, reject) => {
      const suite = setupFn();
      const categoryResults: BenchmarkResult[] = [];

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        suite.abort();
        reject(new Error(`Benchmark ${category} timed out after 30 seconds`));
      }, 30000);

      suite
        .on('cycle', (event: any) => {
          const target = event.target;
          console.log(String(target));
          categoryResults.push({
            category,
            name: target.name,
            hz: target.hz,
            mean: target.stats.mean,
            rme: target.stats.rme
          });
        })
        .on('complete', () => {
          clearTimeout(timeout);
          console.log(`\n${category} - Fastest: ${suite.filter('fastest').map('name')[0]}\n`);
          resolve(categoryResults);
        })
        .on('error', (error: any) => {
          clearTimeout(timeout);
          reject(error);
        })
        .run({ async: true });
    });
  }

  async runBasicOperations() {
    console.log('\n🚀 Running Basic Operations Benchmarks...\n');

    const setupBasicSuite = () => {
      const suite = new Benchmark.Suite();
      
      // Setup stores
      const reactPouch = createReactPouch(initialState);
      const zustandStore = createZustandStore(initialState);
      const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
      const { store: reduxStore, actions } = createReduxStore(initialState);
      const valtioStore = createValtioStore(initialState);

      return suite
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
          valtioStore.todos.length;
        })
        .add('React Pouch - Set State', () => {
          reactPouch.set(state => ({ ...state, todos: generateRandomTodos(5) }));
        })
        .add('Zustand - Set State', () => {
          zustandStore.getState().updateTodos(generateRandomTodos(5));
        })
        .add('Jotai - Set State', () => {
          jotaiStore.set(stateAtom, state => ({ ...state, todos: generateRandomTodos(5) }));
        })
        .add('Redux - Set State', () => {
          reduxStore.dispatch(actions.updateTodos(generateRandomTodos(5)));
        })
        .add('Valtio - Set State', () => {
          valtioStore.todos = generateRandomTodos(5);
        });
    };

    const results = await this.runBenchmarkSuite('Basic Operations', setupBasicSuite);
    this.results.push(...results);
    return results;
  }

  async runLargeStateOperations() {
    console.log('\n🔥 Running Large State Operations Benchmarks...\n');

    const setupLargeSuite = () => {
      const suite = new Benchmark.Suite();
      const largeState = createLargeState(1000);
      
      // Setup stores with large state
      const reactPouch = createReactPouch(largeState);
      const zustandStore = createZustandStore(largeState);
      const { store: jotaiStore, stateAtom } = createJotaiStore(largeState);
      const { store: reduxStore, actions } = createReduxStore(largeState);
      const valtioStore = createValtioStore(largeState);

      return suite
        .add('React Pouch - Large State Read', () => {
          const state = reactPouch.get();
          return state.todos.length;
        })
        .add('Zustand - Large State Read', () => {
          const state = zustandStore.getState();
          return state.todos.length;
        })
        .add('Jotai - Large State Read', () => {
          const state = jotaiStore.get(stateAtom);
          return state.todos.length;
        })
        .add('Redux - Large State Read', () => {
          const state = reduxStore.getState();
          return state.app.todos.length;
        })
        .add('Valtio - Large State Read', () => {
          return valtioStore.todos.length;
        });
    };

    const results = await this.runBenchmarkSuite('Large State Operations', setupLargeSuite);
    this.results.push(...results);
    return results;
  }

  async runComplexUpdates() {
    console.log('\n🔄 Running Complex Update Benchmarks...\n');

    const setupComplexSuite = () => {
      const suite = new Benchmark.Suite();
      
      // Setup stores
      const reactPouch = createReactPouch(initialState);
      const zustandStore = createZustandStore(initialState);
      const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
      const { store: reduxStore, actions } = createReduxStore(initialState);
      const valtioStore = createValtioStore(initialState);

      return suite
        .add('React Pouch - Complex Update', () => {
          reactPouch.set(state => ({
            ...state,
            todos: state.todos.map(todo => 
              todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
            ),
            user: { ...state.user, name: `Updated ${Date.now()}` }
          }));
        })
        .add('Zustand - Complex Update', () => {
          const state = zustandStore.getState();
          zustandStore.setState({
            todos: state.todos.map(todo => 
              todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
            ),
            user: { ...state.user, name: `Updated ${Date.now()}` }
          });
        })
        .add('Jotai - Complex Update', () => {
          jotaiStore.set(stateAtom, state => ({
            ...state,
            todos: state.todos.map(todo => 
              todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
            ),
            user: { ...state.user, name: `Updated ${Date.now()}` }
          }));
        })
        .add('Redux - Complex Update', () => {
          const state = reduxStore.getState();
          reduxStore.dispatch(actions.updateTodos(
            state.app.todos.map(todo => 
              todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
            )
          ));
          reduxStore.dispatch(actions.updateUser({ name: `Updated ${Date.now()}` }));
        })
        .add('Valtio - Complex Update', () => {
          const todo = valtioStore.todos.find(t => t.id === 1);
          if (todo) {
            todo.completed = !todo.completed;
          }
          valtioStore.user.name = `Updated ${Date.now()}`;
        });
    };

    const results = await this.runBenchmarkSuite('Complex Updates', setupComplexSuite);
    this.results.push(...results);
    return results;
  }

  async runMemoryTest() {
    console.log('\n💾 Running Memory Usage Test...\n');

    const measureMemory = () => {
      if (global.gc) {
        global.gc();
      }
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    };

    const testMemoryUsage = (name: string, testFn: () => void) => {
      const initialMemory = measureMemory();
      
      // Perform operations
      for (let i = 0; i < 1000; i++) {
        testFn();
      }
      
      const finalMemory = measureMemory();
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`${name}: ${memoryIncrease.toFixed(2)}MB increase`);
      return memoryIncrease;
    };

    // Test memory usage
    const reactPouch = createReactPouch(initialState);
    const zustandStore = createZustandStore(initialState);
    const { store: jotaiStore, stateAtom } = createJotaiStore(initialState);
    const { store: reduxStore, actions } = createReduxStore(initialState);
    const valtioStore = createValtioStore(initialState);

    testMemoryUsage('React Pouch Memory', () => {
      reactPouch.set(state => ({ ...state, todos: generateRandomTodos(5) }));
    });

    testMemoryUsage('Zustand Memory', () => {
      zustandStore.getState().updateTodos(generateRandomTodos(5));
    });

    testMemoryUsage('Jotai Memory', () => {
      jotaiStore.set(stateAtom, state => ({ ...state, todos: generateRandomTodos(5) }));
    });

    testMemoryUsage('Redux Memory', () => {
      reduxStore.dispatch(actions.updateTodos(generateRandomTodos(5)));
    });

    testMemoryUsage('Valtio Memory', () => {
      valtioStore.todos = generateRandomTodos(5);
    });
  }

  async runAllBenchmarks() {
    console.log('\n🚀 React Pouch Performance Benchmark Suite');
    console.log('==========================================\n');
    console.log('📊 Comparing React Pouch against:');
    console.log('   • Zustand');
    console.log('   • Jotai');
    console.log('   • Redux Toolkit');
    console.log('   • Valtio');
    console.log('\n');

    try {
      await this.runBasicOperations();
      await this.runLargeStateOperations();
      await this.runComplexUpdates();
      await this.runMemoryTest();
      
      this.generateSummaryReport();
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  }

  private generateSummaryReport() {
    const totalDuration = performance.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 BENCHMARK SUMMARY REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n⏱️  Total benchmark duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    
    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    console.log('\n🏆 Performance Winners by Category:');
    console.log('-'.repeat(50));
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const winner = categoryResults.reduce((prev, current) => 
        prev.hz > current.hz ? prev : current
      );
      const opsPerSec = Math.round(winner.hz).toLocaleString();
      console.log(`${category.padEnd(30)} ${winner.name} (${opsPerSec} ops/sec)`);
    });

    // Save results
    this.saveResults();
    
    console.log('\n✅ Benchmark suite completed successfully!');
    console.log('📄 Results saved to: benchmarks/results.json');
    console.log('='.repeat(80));
  }

  private saveResults() {
    const fs = require('fs');
    const path = require('path');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: performance.now() - this.startTime,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memoryUsage: process.memoryUsage()
      },
      results: this.results
    };
    
    const resultsPath = path.join(__dirname, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
  }
}

// Main execution
async function main() {
  if (global.gc) {
    console.log('✅ Garbage collection enabled for memory benchmarks');
  } else {
    console.log('⚠️  Run with --expose-gc for accurate memory benchmarks');
  }

  const runner = new SimpleBenchmarkRunner();
  await runner.runAllBenchmarks();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SimpleBenchmarkRunner };