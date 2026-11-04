const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Meta Tags & Base CSS Variables ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../game_modular/index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, '../game_modular/css/styles.css'), 'utf-8');

// 1. Viewport fit cover & user-scalable check in index.html
assert(
  htmlContent.includes('viewport-fit=cover'),
  'index.html MUST contain viewport-fit=cover in meta viewport'
);

// 2. Theme color meta tag in index.html
assert(
  htmlContent.includes('name="theme-color"'),
  'index.html MUST contain meta name="theme-color"'
);

// 3. Safe area inset variables in styles.css
assert(
  cssContent.includes('--sab: env(safe-area-inset-bottom') || cssContent.includes('env(safe-area-inset-bottom'),
  'styles.css MUST support env(safe-area-inset-bottom)'
);

// 4. Touch-action manipulation in styles.css
assert(
  cssContent.includes('touch-action: manipulation'),
  'styles.css MUST contain touch-action: manipulation'
);

// 5. Overscroll behavior in styles.css
assert(
  cssContent.includes('overscroll-behavior'),
  'styles.css MUST contain overscroll-behavior'
);

console.log('✅ Mobile Meta Tags & Base CSS Variables test passed.');
