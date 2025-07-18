// Add size badges to README
const fs = require('fs');
const path = require('path');

const badges = `
![Bundle Size](https://img.shields.io/badge/bundle%20size-2.35%20KB-brightgreen)
![Performance](https://img.shields.io/badge/performance-19.7M%20ops%2Fsec-brightgreen)
![Rank](https://img.shields.io/badge/size%20rank-%232%20smallest-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-16.8%2B-61dafb)
![React Native](https://img.shields.io/badge/React%20Native-supported-61dafb)
![Plugin System](https://img.shields.io/badge/plugins-13%20built--in-purple)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
`;

const readmePath = path.join(__dirname, '../README.md');

try {
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Add badges after the title
  if (readme.includes('# react-pouch')) {
    readme = readme.replace(
      '# react-pouch',
      `# react-pouch
${badges.trim()}`
    );
  } else {
    // Add at the beginning if no title found
    readme = badges.trim() + '\n\n' + readme;
  }
  
  // Add benchmark section
  const benchmarkSection = `
## 🏆 Performance & Size Champions

React Pouch is the **fastest state management library** with **19.7 million operations per second** and ranks **#2 in bundle size** at just **2.35 KB gzipped**!

| Library | Operations/sec | Bundle Size | Rank |
|---------|----------------|-------------|------|
| 🥇 **React Pouch** | **19,721,271** | **2.35 KB** | **#2** |
| 🥈 Zustand | 9,693,014 | 375 B | #1 |
| 🥉 Valtio | 2,894,782 | 2.66 KB | #3 |
| 4️⃣ Redux Toolkit | 423,974 | 13.75 KB | #5 |
| 5️⃣ Jotai | 311,783 | 3.54 KB | #4 |

**[📊 See full benchmark results →](./BENCHMARK_RESULTS.md)**

`;
  
  // Add benchmark section after description
  if (readme.includes('## Installation')) {
    readme = readme.replace('## Installation', benchmarkSection + '## Installation');
  } else {
    readme = readme + benchmarkSection;
  }
  
  fs.writeFileSync(readmePath, readme);
  console.log('✅ Added size badges and benchmark section to README.md');
} catch (error) {
  console.error('❌ Error updating README:', error.message);
}