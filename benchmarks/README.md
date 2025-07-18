# React Pouch Performance Benchmarks

This directory contains comprehensive performance benchmarks comparing React Pouch against other popular state management libraries.

## Libraries Compared

- **React Pouch** - This library
- **Zustand** - Bear necessities for state management
- **Jotai** - Bottom-up approach to React state management
- **Redux Toolkit** - The official, opinionated, batteries-included toolset for Redux
- **Valtio** - Proxy-state made simple

## Benchmark Categories

### 1. Basic Operations (`basic-operations.ts`)
- **Get Operations**: Reading state from stores
- **Set Operations**: Writing state to stores
- **Nested Updates**: Updating nested objects
- **Large State Operations**: Performance with large datasets
- **Subscription Operations**: Subscribe/unsubscribe performance

### 2. React Render Performance (`react-render.ts`)
- **Initial Render**: Component mounting performance
- **Update Performance**: Re-render performance after state changes
- **Multiple Components**: Performance with many components using the same state

### 3. Memory Usage (`memory-usage.ts`)
- **Basic Memory Usage**: Memory consumption during normal operations
- **Large State Memory**: Memory usage with large datasets
- **Subscription Memory**: Memory overhead of subscriptions

### 4. Complex Scenarios (`complex-scenarios.ts`)
- **Complex Updates**: Performance with nested object updates
- **Batch Updates**: Multiple state updates in succession
- **Concurrent Updates**: Simulated concurrent state changes
- **Deep Nesting**: Performance with deeply nested state structures

## Running Benchmarks

### All Benchmarks
```bash
# Run complete benchmark suite
npm run benchmark

# Run with garbage collection for accurate memory measurements
npm run benchmark:memory
```

### Individual Categories
```bash
# Basic operations only
npm run benchmark:basic

# React render performance only
npm run benchmark:react

# Complex scenarios only
npm run benchmark:complex
```

### Custom Benchmark Runs
```bash
# Run specific benchmark functions
npx ts-node --project benchmarks/tsconfig.json -e "
import('./benchmarks/basic-operations').then(m => m.runBasicOperationsBenchmarks())
"
```

## Understanding Results

### Performance Metrics
- **Ops/sec**: Operations per second (higher is better)
- **Average (ms)**: Average time per operation (lower is better)
- **Margin**: Margin of error as percentage

### Memory Metrics
- **Initial (MB)**: Memory usage before operations
- **Final (MB)**: Memory usage after operations
- **Increase (MB)**: Memory increase during test (lower is better)
- **Avg per Op (KB)**: Average memory per operation (lower is better)

## Output Files

After running benchmarks, you'll find:
- `results.json`: Detailed results in JSON format
- `results.csv`: Summary results in CSV format for analysis

## System Requirements

- Node.js 16+ (for best performance)
- At least 4GB RAM (for large state tests)
- Run with `--expose-gc` flag for accurate memory measurements

## Interpreting Results

### Performance Winners
The benchmark runner automatically identifies the fastest library for each category.

### Memory Efficiency
Lower memory usage indicates better efficiency, especially important for:
- Mobile applications
- Long-running applications
- Applications with large datasets

### Real-world Considerations
- **Bundle Size**: Not measured here, but important for web applications
- **API Ergonomics**: Subjective but affects developer productivity
- **Ecosystem**: Available plugins, middleware, and community support
- **TypeScript Support**: Type safety and inference quality

## Customization

To add new benchmarks:

1. Create test functions in the appropriate file
2. Follow the existing pattern using `tinybench`
3. Add the benchmark to the runner in `runner.ts`
4. Update this README with the new benchmark description

## Contributing

When adding benchmarks:
- Ensure fair comparison across all libraries
- Use realistic data structures and operations
- Include both best-case and worst-case scenarios
- Document any library-specific optimizations used