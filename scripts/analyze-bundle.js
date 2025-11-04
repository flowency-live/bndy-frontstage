#!/usr/bin/env node

/**
 * Bundle analysis script for mobile optimization
 * Helps identify unused dependencies and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencies to analyze
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

// Known heavy dependencies that might not be needed for mobile
const heavyDependencies = [
  'moment', // Use date-fns instead
  'lodash', // Use native JS or specific lodash functions
  'jquery', // Not needed with React
  'bootstrap', // Use Tailwind instead
  'material-ui', // Heavy UI library
  'antd', // Heavy UI library
  'semantic-ui-react', // Heavy UI library
];

// Mobile-optimized alternatives
const alternatives = {
  'moment': 'date-fns (already using ✓)',
  'lodash': 'native JavaScript methods or specific lodash functions',
  'react-icons': 'specific icon imports instead of full library',
  'framer-motion': 'CSS animations for simple cases',
  '@googlemaps/markerclusterer': 'consider lighter clustering solution',
  'leaflet': 'consider if both Google Maps and Leaflet are needed'
};

console.log('🔍 Bundle Analysis for Mobile Optimization\n');

// Check for heavy dependencies
console.log('📦 Heavy Dependencies Found:');
let foundHeavy = false;
Object.keys(dependencies).forEach(dep => {
  if (heavyDependencies.includes(dep)) {
    console.log(`  ❌ ${dep} - Consider removing or replacing`);
    foundHeavy = true;
  }
});

if (!foundHeavy) {
  console.log('  ✅ No known heavy dependencies found');
}

console.log('\n💡 Optimization Suggestions:');

// Check for potential optimizations
Object.keys(dependencies).forEach(dep => {
  if (alternatives[dep]) {
    console.log(`  📝 ${dep}: ${alternatives[dep]}`);
  }
});

// Check for duplicate functionality
console.log('\n🔄 Potential Duplicate Functionality:');

const mapLibraries = Object.keys(dependencies).filter(dep => 
  dep.includes('map') || dep.includes('leaflet') || dep.includes('google')
);

if (mapLibraries.length > 1) {
  console.log(`  📍 Map libraries: ${mapLibraries.join(', ')}`);
  console.log('    Consider using only one mapping solution');
}

const iconLibraries = Object.keys(dependencies).filter(dep => 
  dep.includes('icon') || dep.includes('lucide') || dep.includes('heroicons')
);

if (iconLibraries.length > 1) {
  console.log(`  🎨 Icon libraries: ${iconLibraries.join(', ')}`);
  console.log('    Consider consolidating to one icon library');
}

const uiLibraries = Object.keys(dependencies).filter(dep => 
  dep.includes('radix') || dep.includes('headless') || dep.includes('ui')
);

if (uiLibraries.length > 5) {
  console.log(`  🎛️  UI libraries: ${uiLibraries.length} found`);
  console.log('    Consider if all UI components are necessary');
}

// Mobile-specific recommendations
console.log('\n📱 Mobile-Specific Recommendations:');
console.log('  1. Use dynamic imports for heavy components');
console.log('  2. Implement code splitting by route');
console.log('  3. Use Next.js Image optimization');
console.log('  4. Consider service worker for caching');
console.log('  5. Minimize CSS bundle size');
console.log('  6. Use tree shaking for icon libraries');

// Bundle size estimation
console.log('\n📊 Bundle Size Optimization:');
console.log('  • Run "npm run build:analyze" to see detailed bundle analysis');
console.log('  • Target: < 250KB initial bundle for mobile');
console.log('  • Use lazy loading for non-critical components');
console.log('  • Consider removing unused Tailwind classes');

console.log('\n✨ Next Steps:');
console.log('  1. Run bundle analyzer: npm run build:analyze');
console.log('  2. Implement dynamic imports for heavy components');
console.log('  3. Optimize image loading with Next.js Image');
console.log('  4. Review and remove unused dependencies');
console.log('  5. Test on slow mobile connections');