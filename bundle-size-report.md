# Bundle Size Comparison Report

Generated on: 2025-07-18T09:39:08.608Z

## State Management Libraries Comparison

| Library | Raw Size | Gzipped Size | vs Smallest |
|---------|----------|--------------|-------------|
| zustand | 609 Bytes | 375 Bytes | smallest |
| react-pouch | 6.23 KB | 2.35 KB | 6.4x |
| valtio | 6.33 KB | 2.66 KB | 7.3x |
| jotai | 8.28 KB | 3.54 KB | 9.7x |
| @reduxjs/toolkit | 36.61 KB | 13.75 KB | 37.6x |

## Key Findings

- React Pouch ranks #2 in bundle size
- React Pouch gzipped size: **2.35 KB**

## Methodology

- All measurements performed with esbuild bundler
- Tree-shaking enabled for optimal bundle sizes
- React and React DOM excluded as peer dependencies
- Minification and compression applied
- Gzipped sizes represent realistic network transfer sizes
