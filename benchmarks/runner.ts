#!/usr/bin/env node
import { performance } from 'perf_hooks';
import { 
  runBasicOperationsBenchmarks, 
  runLargeStateOperationsBenchmarks, 
  runSubscriptionBenchmarks 
} from './basic-operations';
import { 
  runReactRenderBenchmarks, 
  runReactUpdateBenchmarks, 
  runMultipleComponentsBenchmarks 
} from './react-render';
import { 
  runMemoryUsageBenchmarks, 
  runLargeStateMemoryBenchmarks, 
  runSubscriptionMemoryBenchmarks 
} from './memory-usage';
import { 
  runComplexUpdateBenchmarks, 
  runBatchUpdateBenchmarks, 
  runConcurrentUpdateBenchmarks, 
  runDeepNestingBenchmarks 
} from './complex-scenarios';

interface BenchmarkResult {
  name?: string;
  hz?: number;
  mean?: number;
  rme?: number;
}

interface MemoryResult {
  library: string;
  initialMemory: number;
  finalMemory: number;
  memoryIncrease: number;
  operationsPerformed: number;
  avgMemoryPerOperation: number;
}

interface BenchmarkSummary {
  category: string;
  results: BenchmarkResult[] | MemoryResult[];
  duration: number;
  timestamp: Date;
}

class BenchmarkRunner {
  private results: BenchmarkSummary[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  private async runBenchmarkCategory(
    name: string, 
    benchmarkFn: () => Promise<any>
  ): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏁 Starting ${name}...`);
    console.log(`${'='.repeat(60)}`);

    const categoryStartTime = performance.now();
    
    try {
      const results = await benchmarkFn();
      const duration = performance.now() - categoryStartTime;
      
      this.results.push({
        category: name,
        results,
        duration,
        timestamp: new Date()
      });
      
      console.log(`\n✅ ${name} completed in ${(duration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error(`\n❌ ${name} failed:`, error);
      console.log(`Duration: ${((performance.now() - categoryStartTime) / 1000).toFixed(2)}s`);
    }
  }

  async runAllBenchmarks(): Promise<void> {
    console.log('\n🚀 React Pouch Performance Benchmark Suite');
    console.log('==========================================\n');
    console.log('📊 Running comprehensive benchmarks against:');
    console.log('   • React Pouch (this library)');
    console.log('   • Zustand');
    console.log('   • Jotai');
    console.log('   • Redux Toolkit');
    console.log('   • Valtio');
    console.log('\n⏱️  Each benchmark runs for 1 second to ensure accurate results\n');

    // Basic Operations
    await this.runBenchmarkCategory('Basic Operations', runBasicOperationsBenchmarks);
    await this.runBenchmarkCategory('Large State Operations', runLargeStateOperationsBenchmarks);
    await this.runBenchmarkCategory('Subscription Operations', runSubscriptionBenchmarks);

    // React Render Tests
    await this.runBenchmarkCategory('React Render Performance', runReactRenderBenchmarks);
    await this.runBenchmarkCategory('React Update Performance', runReactUpdateBenchmarks);
    await this.runBenchmarkCategory('Multiple Components Performance', runMultipleComponentsBenchmarks);

    // Memory Usage
    await this.runBenchmarkCategory('Memory Usage', runMemoryUsageBenchmarks);
    await this.runBenchmarkCategory('Large State Memory Usage', runLargeStateMemoryBenchmarks);
    await this.runBenchmarkCategory('Subscription Memory Usage', runSubscriptionMemoryBenchmarks);

    // Complex Scenarios
    await this.runBenchmarkCategory('Complex Updates', runComplexUpdateBenchmarks);
    await this.runBenchmarkCategory('Batch Updates', runBatchUpdateBenchmarks);
    await this.runBenchmarkCategory('Concurrent Updates', runConcurrentUpdateBenchmarks);
    await this.runBenchmarkCategory('Deep Nesting Updates', runDeepNestingBenchmarks);

    this.generateSummaryReport();
  }

  private generateSummaryReport(): void {
    const totalDuration = performance.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 BENCHMARK SUMMARY REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n⏱️  Total benchmark duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log(`🧪 Total categories tested: ${this.results.length}`);
    
    // Category duration summary
    console.log('\n📊 Category Performance Summary:');
    console.log('-'.repeat(50));
    this.results.forEach(result => {
      console.log(`${result.category.padEnd(35)} ${(result.duration / 1000).toFixed(2)}s`);
    });

    // Find fastest library per category (for non-memory benchmarks)
    console.log('\n🏆 Performance Winners by Category:');
    console.log('-'.repeat(50));
    
    this.results.forEach(categoryResult => {
      if (Array.isArray(categoryResult.results) && categoryResult.results.length > 0) {
        const firstResult = categoryResult.results[0];
        
        // Check if it's a memory benchmark result
        if ('library' in firstResult && 'memoryIncrease' in firstResult) {
          // For memory benchmarks, find the one with lowest memory increase
          const memoryResults = categoryResult.results as MemoryResult[];
          const winner = memoryResults.reduce((prev, current) => 
            prev.memoryIncrease < current.memoryIncrease ? prev : current
          );
          console.log(`${categoryResult.category.padEnd(35)} ${winner.library} (${winner.memoryIncrease.toFixed(2)}MB)`);
        } else {
          // For performance benchmarks, find the one with highest ops/sec
          const perfResults = categoryResult.results as BenchmarkResult[];
          const winner = perfResults.reduce((prev, current) => 
            (prev.hz || 0) > (current.hz || 0) ? prev : current
          );
          const opsPerSec = winner.hz ? Math.round(winner.hz).toLocaleString() : 'N/A';
          console.log(`${categoryResult.category.padEnd(35)} ${winner.name || 'Unknown'} (${opsPerSec} ops/sec)`);
        }
      }
    });

    // System information
    console.log('\n🖥️  System Information:');
    console.log('-'.repeat(50));
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
    
    // Save detailed results to file
    this.saveResultsToFile();
    
    console.log('\n✅ Benchmark suite completed successfully!');
    console.log('📄 Detailed results saved to: benchmarks/results.json');
    console.log('='.repeat(80));
  }

  private saveResultsToFile(): void {
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
    
    // Also save a CSV summary for easy analysis
    this.saveCSVSummary();
  }

  private saveCSVSummary(): void {
    const fs = require('fs');
    const path = require('path');
    
    let csvContent = 'Category,Library,Metric,Value,Unit\n';
    
    this.results.forEach(categoryResult => {
      if (Array.isArray(categoryResult.results)) {
        categoryResult.results.forEach(result => {
          if ('library' in result && 'memoryIncrease' in result) {
            // Memory result
            const memResult = result as MemoryResult;
            csvContent += `${categoryResult.category},${memResult.library},Memory Increase,${memResult.memoryIncrease.toFixed(2)},MB\n`;
            csvContent += `${categoryResult.category},${memResult.library},Avg Memory Per Operation,${(memResult.avgMemoryPerOperation * 1024).toFixed(2)},KB\n`;
          } else {
            // Performance result
            const perfResult = result as BenchmarkResult;
            if (perfResult.hz) {
              csvContent += `${categoryResult.category},${perfResult.name},Operations per Second,${Math.round(perfResult.hz)},ops/sec\n`;
            }
            if (perfResult.mean) {
              csvContent += `${categoryResult.category},${perfResult.name},Average Time,${(perfResult.mean * 1000).toFixed(4)},ms\n`;
            }
          }
        });
      }
    });
    
    const csvPath = path.join(__dirname, 'results.csv');
    fs.writeFileSync(csvPath, csvContent);
  }
}

// Main execution
async function main() {
  // Enable garbage collection for memory benchmarks
  if (global.gc) {
    console.log('✅ Garbage collection enabled for memory benchmarks');
  } else {
    console.log('⚠️  Garbage collection not available. Run with --expose-gc for accurate memory benchmarks');
  }

  const runner = new BenchmarkRunner();
  await runner.runAllBenchmarks();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { BenchmarkRunner };