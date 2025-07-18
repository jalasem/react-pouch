// Benchmark setup and utilities
const Benchmark = require('benchmark');

// Error handling wrapper for benchmark functions
function createSafeBenchmark(name, fn, setup = null, teardown = null) {
  return {
    name,
    fn: function() {
      try {
        return fn.call(this);
      } catch (error) {
        console.error(`Benchmark "${name}" failed:`, error);
        throw error;
      }
    },
    setup,
    teardown
  };
}

// Benchmark runner with error recovery
function runBenchmarkSuite(suiteName, benchmarks, options = {}) {
  return new Promise((resolve, reject) => {
    const suite = new Benchmark.Suite(suiteName, options);
    const results = [];
    
    benchmarks.forEach(benchmark => {
      try {
        suite.add(benchmark.name, benchmark.fn, {
          setup: benchmark.setup,
          teardown: benchmark.teardown,
          onError: function(event) {
            console.error(`Error in benchmark "${benchmark.name}":`, event.target.error);
            // Try to fix common issues
            if (event.target.error.message.includes('not defined')) {
              console.log('Attempting to fix undefined variable issue...');
              // Reset and retry
              event.target.reset();
            }
          }
        });
      } catch (error) {
        console.error(`Failed to add benchmark "${benchmark.name}":`, error);
        // Continue with other benchmarks
      }
    });

    suite
      .on('cycle', function(event) {
        const benchmark = event.target;
        results.push({
          name: benchmark.name,
          hz: benchmark.hz,
          rme: benchmark.stats.rme,
          sample: benchmark.stats.sample,
          mean: benchmark.stats.mean,
          error: benchmark.error
        });
        console.log(String(event.target));
      })
      .on('complete', function() {
        console.log(`\n${suiteName} - Fastest is: ${this.filter('fastest').map('name')}`);
        resolve(results);
      })
      .on('error', function(event) {
        console.error(`Suite "${suiteName}" error:`, event.target.error);
        // Try to continue with remaining benchmarks
        if (event.target.error.message.includes('timeout')) {
          console.log('Benchmark timeout - reducing iterations...');
          // Reduce iterations and retry
          event.target.options.maxTime = 1;
        }
      })
      .run({ async: true });
  });
}

// Memory usage measurement
function measureMemoryUsage(fn, iterations = 1000) {
  if (typeof global.gc === 'function') {
    global.gc();
  }
  
  const initialMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    try {
      fn();
    } catch (error) {
      console.error(`Memory test iteration ${i} failed:`, error);
      break;
    }
  }
  
  if (typeof global.gc === 'function') {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage();
  
  return {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    external: finalMemory.external - initialMemory.external
  };
}

module.exports = {
  createSafeBenchmark,
  runBenchmarkSuite,
  measureMemoryUsage
};