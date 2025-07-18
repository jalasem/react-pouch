// Fixed benchmark that addresses the dubious results issue
const fs = require('fs');
const path = require('path');

// Import libraries with error handling
let reactPouch, zustand, jotai, valtio, reduxToolkit;

console.log('📦 Loading libraries...');

try {
  require('child_process').execSync('npm run build', { stdio: 'inherit' });
  reactPouch = require('../dist/index');
  console.log('✅ React Pouch loaded');
} catch (error) {
  console.error('❌ React Pouch not available');
  reactPouch = null;
}

try {
  zustand = require('zustand');
  console.log('✅ Zustand loaded');
} catch (error) {
  console.error('❌ Zustand not available');
  zustand = null;
}

try {
  jotai = require('jotai');
  console.log('✅ Jotai loaded');
} catch (error) {
  console.error('❌ Jotai not available');
  jotai = null;
}

try {
  valtio = require('valtio');
  console.log('✅ Valtio loaded');
} catch (error) {
  console.error('❌ Valtio not available');
  valtio = null;
}

try {
  reduxToolkit = require('@reduxjs/toolkit');
  console.log('✅ Redux Toolkit loaded');
} catch (error) {
  console.error('❌ Redux Toolkit not available');
  reduxToolkit = null;
}

// Proper benchmark measurement
function benchmarkOperation(name, setupFn, operationFn) {
  console.log(`\n🔄 Benchmarking ${name}...`);
  
  try {
    // Setup
    const context = setupFn();
    
    // Warm up (important for V8 optimization)
    for (let i = 0; i < 1000; i++) {
      operationFn(context);
    }
    
    // Multiple runs for statistical validity
    const runs = 10;
    const iterations = 50000;
    const timings = [];
    
    for (let run = 0; run < runs; run++) {
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        operationFn(context);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      timings.push(durationMs);
    }
    
    // Calculate statistics
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    const variance = timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length;
    const stdDev = Math.sqrt(variance);
    const rme = (stdDev / avgTime) * 100;
    
    const opsPerSecond = Math.round((iterations * 1000) / avgTime);
    const avgTimePerOp = avgTime / iterations;
    
    console.log(`   Operations/sec: ${opsPerSecond.toLocaleString()}`);
    console.log(`   Avg time/op: ${avgTimePerOp.toFixed(6)} ms`);
    console.log(`   Min time: ${minTime.toFixed(2)} ms`);
    console.log(`   Max time: ${maxTime.toFixed(2)} ms`);
    console.log(`   RME: ±${rme.toFixed(2)}%`);
    console.log(`   Runs: ${runs} × ${iterations.toLocaleString()} ops`);
    
    return {
      name,
      opsPerSecond,
      avgTimePerOp,
      minTime,
      maxTime,
      rme,
      runs,
      iterations,
      success: true
    };
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return {
      name,
      opsPerSecond: 0,
      avgTimePerOp: 0,
      minTime: 0,
      maxTime: 0,
      rme: 0,
      runs: 0,
      iterations: 0,
      success: false,
      error: error.message
    };
  }
}

// Run proper benchmarks
function runBenchmarks() {
  console.log('\n=== State Management Library Benchmarks ===');
  console.log('Using proper statistical analysis with multiple runs\n');
  
  const results = [];
  
  // React Pouch benchmark
  if (reactPouch) {
    const result = benchmarkOperation(
      'React Pouch',
      () => {
        const pouch = reactPouch.pouch({ count: 0, data: 'test' });
        return { pouch };
      },
      (context) => {
        // Meaningful operations
        context.pouch.set(prev => ({ ...prev, count: prev.count + 1 }));
        const current = context.pouch.get();
        // Add some conditional logic to make it realistic
        if (current.count % 100 === 0) {
          context.pouch.set(prev => ({ ...prev, data: `updated-${prev.count}` }));
        }
      }
    );
    results.push(result);
  }
  
  // Zustand benchmark
  if (zustand) {
    const result = benchmarkOperation(
      'Zustand',
      () => {
        const store = zustand.create((set, get) => ({
          count: 0,
          data: 'test',
          increment: () => set(state => ({ count: state.count + 1 })),
          updateData: (data) => set({ data })
        }));
        return { store };
      },
      (context) => {
        context.store.setState(state => ({ count: state.count + 1 }));
        const current = context.store.getState();
        if (current.count % 100 === 0) {
          context.store.setState({ data: `updated-${current.count}` });
        }
      }
    );
    results.push(result);
  }
  
  // Jotai benchmark
  if (jotai) {
    const result = benchmarkOperation(
      'Jotai',
      () => {
        const countAtom = jotai.atom(0);
        const dataAtom = jotai.atom('test');
        const store = jotai.createStore();
        return { countAtom, dataAtom, store };
      },
      (context) => {
        const currentCount = context.store.get(context.countAtom);
        context.store.set(context.countAtom, currentCount + 1);
        if (currentCount % 100 === 0) {
          context.store.set(context.dataAtom, `updated-${currentCount}`);
        }
      }
    );
    results.push(result);
  }
  
  // Valtio benchmark
  if (valtio) {
    const result = benchmarkOperation(
      'Valtio',
      () => {
        const state = valtio.proxy({ count: 0, data: 'test' });
        return { state };
      },
      (context) => {
        context.state.count += 1;
        if (context.state.count % 100 === 0) {
          context.state.data = `updated-${context.state.count}`;
        }
      }
    );
    results.push(result);
  }
  
  // Redux Toolkit benchmark
  if (reduxToolkit) {
    const result = benchmarkOperation(
      'Redux Toolkit',
      () => {
        const slice = reduxToolkit.createSlice({
          name: 'counter',
          initialState: { count: 0, data: 'test' },
          reducers: {
            increment: (state) => { state.count += 1; },
            updateData: (state, action) => { state.data = action.payload; }
          }
        });
        
        const store = reduxToolkit.configureStore({
          reducer: slice.reducer
        });
        
        return { store, actions: slice.actions };
      },
      (context) => {
        context.store.dispatch(context.actions.increment());
        const state = context.store.getState();
        if (state.count % 100 === 0) {
          context.store.dispatch(context.actions.updateData(`updated-${state.count}`));
        }
      }
    );
    results.push(result);
  }
  
  return results;
}

// Bundle size analysis
function analyzeBundleSizes() {
  console.log('\n=== Bundle Size Analysis ===');
  
  try {
    const bundleResults = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../bundle-size-report.json'), 
      'utf8'
    ));
    
    console.log('\nBundle sizes (from previous analysis):');
    bundleResults.libraries.forEach(lib => {
      console.log(`   ${lib.name}: ${(lib.gzippedSize / 1024).toFixed(2)} KB gzipped`);
    });
    
    return bundleResults.libraries;
  } catch (error) {
    console.log('❌ Bundle size data not found. Run `npm run compare` first.');
    return [];
  }
}

// Generate honest report
function generateHonestReport(performanceResults, bundleResults) {
  const timestamp = new Date().toISOString();
  
  let report = `# React Pouch Honest Benchmark Report

Generated: ${timestamp}

## Methodology & Transparency

This benchmark addresses the "dubious results" issue by implementing:

1. **Proper Statistical Analysis**: Multiple runs with statistical validation
2. **Realistic Workloads**: Meaningful operations beyond trivial get/set
3. **Warm-up Phases**: Ensures V8 optimization takes effect
4. **Transparent Reporting**: Shows all statistics including variance and RME

## Performance Results

### State Management Operations
*50,000 operations per run, 10 runs per library*

| Library | Ops/sec | Avg Time/op | Min Time | Max Time | RME | Status |
|---------|---------|-------------|----------|----------|-----|---------|
`;

  // Sort by performance
  const successful = performanceResults.filter(r => r.success);
  const sorted = successful.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
  
  sorted.forEach((result, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
    report += `| ${rank} ${result.name} | ${result.opsPerSecond.toLocaleString()} | ${result.avgTimePerOp.toFixed(6)} ms | ${result.minTime.toFixed(2)} ms | ${result.maxTime.toFixed(2)} ms | ±${result.rme.toFixed(2)}% | ✅ |\n`;
  });
  
  // Add failed results
  const failed = performanceResults.filter(r => !r.success);
  failed.forEach(result => {
    report += `| ❌ ${result.name} | N/A | N/A | N/A | N/A | N/A | Failed |\n`;
  });
  
  if (bundleResults.length > 0) {
    report += `\n### Bundle Size Comparison

| Library | Gzipped Size | Raw Size | Rank |
|---------|--------------|----------|------|
`;
    
    bundleResults.sort((a, b) => a.gzippedSize - b.gzippedSize);
    bundleResults.forEach((result, index) => {
      const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
      report += `| ${rank} ${result.name} | ${(result.gzippedSize / 1024).toFixed(2)} KB | ${(result.rawSize / 1024).toFixed(2)} KB | #${index + 1} |\n`;
    });
  }
  
  report += `\n## Analysis & Honest Assessment

### Performance Insights
`;
  
  if (sorted.length > 0) {
    const winner = sorted[0];
    const reactPouchResult = sorted.find(r => r.name.includes('React Pouch'));
    
    report += `- **Performance Winner**: ${winner.name} (${winner.opsPerSecond.toLocaleString()} ops/sec)\n`;
    report += `- **Statistical Validity**: All measurements include proper RME calculations\n`;
    
    if (reactPouchResult) {
      const rank = sorted.findIndex(r => r.name.includes('React Pouch')) + 1;
      const relativePerf = (reactPouchResult.opsPerSecond / winner.opsPerSecond * 100).toFixed(1);
      report += `- **React Pouch Rank**: #${rank} (${relativePerf}% of winner's performance)\n`;
    }
  }
  
  report += `\n### Size Assessment
`;
  
  if (bundleResults.length > 0) {
    const smallest = bundleResults[0];
    const reactPouchBundle = bundleResults.find(r => r.name.includes('react-pouch'));
    
    report += `- **Size Winner**: ${smallest.name} (${(smallest.gzippedSize / 1024).toFixed(2)} KB)\n`;
    
    if (reactPouchBundle) {
      const rank = bundleResults.findIndex(r => r.name.includes('react-pouch')) + 1;
      const sizeRatio = (reactPouchBundle.gzippedSize / smallest.gzippedSize).toFixed(1);
      report += `- **React Pouch Size Rank**: #${rank} (${sizeRatio}x larger than smallest)\n`;
    }
  }
  
  report += `\n## Honest Conclusions

1. **Measurement Validity**: This benchmark uses proper statistical methodology
2. **Performance Varies**: Different libraries excel in different scenarios
3. **Size Matters**: Bundle size is a real consideration for production apps
4. **Trade-offs Exist**: No single library is perfect for all use cases

### Why Previous Results Were Dubious
- Operations were too simple (basic get/set)
- No warm-up phases for V8 optimization
- Insufficient statistical analysis
- No meaningful workload differences

### This Benchmark Fixes
- ✅ Multiple runs with statistical analysis
- ✅ Realistic operations with conditional logic
- ✅ Proper warm-up phases
- ✅ Transparent reporting of all metrics

---

*Run honest benchmarks: \`npm run benchmark:honest\`*
`;

  return report;
}

// Main execution
function runHonestBenchmarks() {
  console.log('🎯 Running HONEST React Pouch benchmarks...');
  console.log('Addressing the "dubious results" issue with proper methodology\n');
  
  const performanceResults = runBenchmarks();
  const bundleResults = analyzeBundleSizes();
  
  // Generate report
  const report = generateHonestReport(performanceResults, bundleResults);
  
  // Save results
  const resultsDir = path.join(__dirname, '../benchmark-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(resultsDir, 'honest-benchmark-report.md'), report);
  fs.writeFileSync(path.join(resultsDir, 'honest-results.json'), JSON.stringify({
    performance: performanceResults,
    bundle: bundleResults,
    timestamp: new Date().toISOString(),
    methodology: 'Multiple runs with statistical analysis'
  }, null, 2));
  
  console.log('\n📊 HONEST BENCHMARK RESULTS');
  console.log('============================');
  
  const successful = performanceResults.filter(r => r.success);
  if (successful.length > 0) {
    console.log('\n🏆 Performance Ranking:');
    successful
      .sort((a, b) => b.opsPerSecond - a.opsPerSecond)
      .forEach((result, index) => {
        const rank = index + 1;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
        console.log(`   ${medal} #${rank}: ${result.name}`);
        console.log(`       ${result.opsPerSecond.toLocaleString()} ops/sec (±${result.rme.toFixed(2)}%)`);
      });
  }
  
  console.log('\n📈 Key Findings:');
  console.log('   - Results now include proper statistical analysis');
  console.log('   - RME (Relative Margin of Error) shows measurement confidence');
  console.log('   - Multiple runs ensure statistical validity');
  console.log('   - Realistic workloads provide meaningful comparisons');
  
  console.log('\n✅ Honest benchmark report: benchmark-results/honest-benchmark-report.md');
}

// Export and run
module.exports = { runHonestBenchmarks };

if (require.main === module) {
  runHonestBenchmarks();
}