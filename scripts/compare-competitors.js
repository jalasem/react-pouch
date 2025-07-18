#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');
const { analyzeReactPouch } = require('./analyze-bundle');

const TEMP_DIR = path.join(__dirname, '../temp-competitor-analysis');

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

async function analyzeCompetitor(libraryName, importStatement) {
  try {
    // Create a temporary entry file that imports the library
    const entryContent = `
import ${importStatement} from '${libraryName}';
export * from '${libraryName}';
    `;
    
    const entryPath = path.join(TEMP_DIR, `${libraryName.replace(/[@\/]/g, '-')}-entry.js`);
    const outputPath = path.join(TEMP_DIR, `${libraryName.replace(/[@\/]/g, '-')}-bundle.js`);
    
    fs.writeFileSync(entryPath, entryContent);
    
    // Build with esbuild
    await build({
      entryPoints: [entryPath],
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
      name: libraryName,
      rawSize,
      gzippedSize
    };
  } catch (error) {
    console.error(`Error analyzing ${libraryName}:`, error.message);
    return {
      name: libraryName,
      rawSize: 0,
      gzippedSize: 0,
      error: error.message
    };
  }
}

async function runComparison() {
  console.log(`${colors.bold}${colors.blue}State Management Libraries Bundle Size Comparison${colors.reset}\n`);
  
  // Define competitors with their import statements
  const competitors = [
    { name: 'zustand', import: '{ create }' },
    { name: 'jotai', import: '{ atom, useAtom }' },
    { name: '@reduxjs/toolkit', import: '{ createSlice, configureStore }' },
    { name: 'valtio', import: '{ proxy, useSnapshot }' }
  ];

  console.log('Analyzing competitors...');
  
  // Analyze all competitors
  const competitorResults = [];
  for (const competitor of competitors) {
    console.log(`  • ${competitor.name}`);
    const result = await analyzeCompetitor(competitor.name, competitor.import);
    competitorResults.push(result);
  }

  // Analyze React Pouch
  console.log('  • react-pouch (local)');
  const reactPouchResults = await analyzeReactPouch();
  
  let reactPouchBest = null;
  if (reactPouchResults && reactPouchResults.length > 0) {
    reactPouchBest = reactPouchResults.reduce((smallest, current) => 
      current.gzippedSize < smallest.gzippedSize ? current : smallest
    );
  }

  // Add React Pouch to results
  const allResults = [];
  if (reactPouchBest) {
    allResults.push({
      name: 'react-pouch',
      rawSize: reactPouchBest.rawSize,
      gzippedSize: reactPouchBest.gzippedSize
    });
  }
  allResults.push(...competitorResults);

  // Sort by gzipped size
  allResults.sort((a, b) => a.gzippedSize - b.gzippedSize);

  // Display comparison table
  console.log(`\n${colors.bold}Bundle Size Comparison Results:${colors.reset}\n`);
  console.log('┌─────────────────────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│ Library                     │ Raw Size    │ Gzipped     │ vs Smallest │');
  console.log('├─────────────────────────────┼─────────────┼─────────────┼─────────────┤');
  
  const smallestSize = allResults[0].gzippedSize;
  
  allResults.forEach((result, index) => {
    const nameCol = result.name.padEnd(27);
    const rawCol = formatBytes(result.rawSize).padStart(11);
    const gzipCol = formatBytes(result.gzippedSize).padStart(11);
    
    let comparison = '';
    if (result.gzippedSize === smallestSize) {
      comparison = `${colors.green}smallest${colors.reset}`;
    } else {
      const multiplier = (result.gzippedSize / smallestSize).toFixed(1);
      comparison = `${colors.yellow}${multiplier}x${colors.reset}`;
    }
    comparison = comparison.padEnd(18); // Account for color codes
    
    console.log(`│ ${nameCol} │ ${rawCol} │ ${gzipCol} │ ${comparison.slice(0, 11)} │`);
  });
  
  console.log('└─────────────────────────────┴─────────────┴─────────────┴─────────────┘\n');

  // Summary
  const reactPouchResult = allResults.find(r => r.name === 'react-pouch');
  const reactPouchPosition = allResults.findIndex(r => r.name === 'react-pouch') + 1;
  
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`• React Pouch ranks #${reactPouchPosition} in bundle size`);
  console.log(`• React Pouch gzipped size: ${colors.green}${formatBytes(reactPouchResult.gzippedSize)}${colors.reset}`);
  
  if (reactPouchPosition === 1) {
    console.log(`• ${colors.green}🎉 React Pouch is the smallest library!${colors.reset}`);
  } else {
    const smallest = allResults[0];
    const difference = reactPouchResult.gzippedSize - smallest.gzippedSize;
    console.log(`• React Pouch is ${formatBytes(difference)} larger than the smallest (${smallest.name})`);
  }

  // Performance insights
  console.log(`\n${colors.bold}Bundle Size Insights:${colors.reset}`);
  console.log('• All sizes measured with tree-shaking enabled');
  console.log('• React and React DOM are excluded as peer dependencies');
  console.log('• Gzipped sizes represent realistic network transfer sizes');
  console.log('• Smaller bundles lead to faster initial page loads');

  // Clean up temp files
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  return allResults;
}

// Generate a markdown report
function generateMarkdownReport(results) {
  const smallestSize = results[0].gzippedSize;
  const reportPath = path.join(__dirname, '../bundle-size-report.md');
  
  let markdown = `# Bundle Size Comparison Report\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += `## State Management Libraries Comparison\n\n`;
  markdown += `| Library | Raw Size | Gzipped Size | vs Smallest |\n`;
  markdown += `|---------|----------|--------------|-------------|\n`;
  
  results.forEach(result => {
    const comparison = result.gzippedSize === smallestSize 
      ? 'smallest' 
      : `${(result.gzippedSize / smallestSize).toFixed(1)}x`;
    
    markdown += `| ${result.name} | ${formatBytes(result.rawSize)} | ${formatBytes(result.gzippedSize)} | ${comparison} |\n`;
  });
  
  markdown += `\n## Key Findings\n\n`;
  const reactPouchResult = results.find(r => r.name === 'react-pouch');
  const reactPouchPosition = results.findIndex(r => r.name === 'react-pouch') + 1;
  
  markdown += `- React Pouch ranks #${reactPouchPosition} in bundle size\n`;
  markdown += `- React Pouch gzipped size: **${formatBytes(reactPouchResult.gzippedSize)}**\n`;
  
  if (reactPouchPosition === 1) {
    markdown += `- 🎉 **React Pouch is the smallest library!**\n`;
  }
  
  markdown += `\n## Methodology\n\n`;
  markdown += `- All measurements performed with esbuild bundler\n`;
  markdown += `- Tree-shaking enabled for optimal bundle sizes\n`;
  markdown += `- React and React DOM excluded as peer dependencies\n`;
  markdown += `- Minification and compression applied\n`;
  markdown += `- Gzipped sizes represent realistic network transfer sizes\n`;
  
  fs.writeFileSync(reportPath, markdown);
  console.log(`\n${colors.green}Report saved to:${colors.reset} ${reportPath}`);
}

// Run the comparison
if (require.main === module) {
  runComparison()
    .then(results => {
      generateMarkdownReport(results);
    })
    .catch(console.error);
}

module.exports = { runComparison };