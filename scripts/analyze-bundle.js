#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { build } = require('esbuild');

const DIST_DIR = path.join(__dirname, '../dist');
const TEMP_DIR = path.join(__dirname, '../temp-bundle-analysis');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analyzeBundle(entry, outputName) {
  try {
    const outputPath = path.join(TEMP_DIR, `${outputName}.js`);
    
    // Build with esbuild for accurate size measurement
    await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: outputPath,
      external: ['react', 'react-dom'],
      treeShaking: true,
      target: 'es2020'
    });

    // Read the built file
    const bundleContent = fs.readFileSync(outputPath, 'utf8');
    const rawSize = Buffer.byteLength(bundleContent, 'utf8');
    
    // Use dynamic import for gzip-size (ESM module)
    const { gzipSizeSync } = await import('gzip-size');
    const gzippedSize = gzipSizeSync(bundleContent);

    return {
      name: outputName,
      rawSize,
      gzippedSize,
      path: outputPath
    };
  } catch (error) {
    console.error(`Error analyzing ${outputName}:`, error.message);
    return null;
  }
}

async function analyzeReactPouch() {
  console.log(`${colors.bold}${colors.blue}React Pouch Bundle Analysis${colors.reset}\n`);
  
  // First, build the project to ensure we have the latest dist files
  console.log('Building React Pouch...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error.message);
    return;
  }

  const analyses = [];

  // Analyze the main bundle
  const mainBundle = path.join(DIST_DIR, 'index.js');
  if (fs.existsSync(mainBundle)) {
    const result = await analyzeBundle(mainBundle, 'react-pouch-main');
    if (result) analyses.push(result);
  }

  // Analyze the ESM bundle
  const esmBundle = path.join(DIST_DIR, 'index.esm.js');
  if (fs.existsSync(esmBundle)) {
    const result = await analyzeBundle(esmBundle, 'react-pouch-esm');
    if (result) analyses.push(result);
  }

  // Analyze source directly (most accurate for tree-shaking)
  const sourceEntry = path.join(__dirname, '../src/index.ts');
  if (fs.existsSync(sourceEntry)) {
    const result = await analyzeBundle(sourceEntry, 'react-pouch-source');
    if (result) analyses.push(result);
  }

  // Display results
  console.log(`${colors.bold}Bundle Size Analysis Results:${colors.reset}\n`);
  console.log('┌─────────────────────────────┬─────────────┬─────────────┐');
  console.log('│ Bundle                      │ Raw Size    │ Gzipped     │');
  console.log('├─────────────────────────────┼─────────────┼─────────────┤');
  
  analyses.forEach(analysis => {
    const nameCol = analysis.name.padEnd(27);
    const rawCol = formatBytes(analysis.rawSize).padStart(11);
    const gzipCol = formatBytes(analysis.gzippedSize).padStart(11);
    
    console.log(`│ ${nameCol} │ ${rawCol} │ ${gzipCol} │`);
  });
  
  console.log('└─────────────────────────────┴─────────────┴─────────────┘\n');

  // Find the smallest bundle (likely the source-based one)
  if (analyses.length === 0) {
    console.log(`${colors.red}No bundles were successfully analyzed.${colors.reset}`);
    return [];
  }
  
  const smallestBundle = analyses.reduce((smallest, current) => 
    current.gzippedSize < smallest.gzippedSize ? current : smallest
  );

  console.log(`${colors.green}${colors.bold}Smallest Bundle:${colors.reset} ${smallestBundle.name}`);
  console.log(`${colors.green}Raw Size:${colors.reset} ${formatBytes(smallestBundle.rawSize)}`);
  console.log(`${colors.green}Gzipped Size:${colors.reset} ${formatBytes(smallestBundle.gzippedSize)}`);

  // Clean up temp files
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  return analyses;
}

// Run the analysis
if (require.main === module) {
  analyzeReactPouch().catch(console.error);
}

module.exports = { analyzeReactPouch, analyzeBundle };