const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Bottom Navigation & Active Tab Indication ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../game_modular/index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, '../game_modular/css/styles.css'), 'utf-8');
const uiContent = fs.readFileSync(path.join(__dirname, '../game_modular/js/ui.js'), 'utf-8');

// 1. Check styles.css has safe area in .mobile-bottom-nav and body padding
assert(
  cssContent.includes('.mobile-bottom-nav') &&
  (cssContent.includes('padding-bottom: var(--sab)') || cssContent.includes('padding-bottom: env(safe-area-inset-bottom')),
  'styles.css MUST include safe-area-inset-bottom padding in .mobile-bottom-nav'
);

// 2. Check styles.css has active state styling for mobile tab buttons
assert(
  cssContent.includes('.mobile-tab-btn.active') || cssContent.includes('.active-mobile-tab'),
  'styles.css MUST define active state styling for mobile tab buttons'
);

// 3. Check ui.js updates mobile tab buttons in switchTab
assert(
  uiContent.includes('updateMobileNavUI') ||
  (uiContent.includes('mobileTabBtn_') && uiContent.includes('switchTab')),
  'ui.js MUST update mobile tab buttons active state inside switchTab'
);

console.log('✅ Mobile Bottom Navigation & Active Tab Indication test passed.');
