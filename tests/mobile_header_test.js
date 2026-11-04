const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Header & Quick Settings Menu ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../game_modular/index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, '../game_modular/css/styles.css'), 'utf-8');
const uiContent = fs.readFileSync(path.join(__dirname, '../game_modular/js/ui.js'), 'utf-8');

// 1. Mobile settings sheet modal exists in index.html
assert(
  htmlContent.includes('id="mobileSettingsSheet"'),
  'index.html MUST contain id="mobileSettingsSheet"'
);

// 2. Mobile menu trigger button exists in index.html
assert(
  htmlContent.includes('id="btnMobileMenu"'),
  'index.html MUST contain id="btnMobileMenu"'
);

// 3. openMobileSettingsMenu and closeMobileSettingsMenu functions exist in ui.js
assert(
  uiContent.includes('function openMobileSettingsMenu') || uiContent.includes('openMobileSettingsMenu ='),
  'ui.js MUST define openMobileSettingsMenu'
);
assert(
  uiContent.includes('function closeMobileSettingsMenu') || uiContent.includes('closeMobileSettingsMenu ='),
  'ui.js MUST define closeMobileSettingsMenu'
);

// 4. Stylesheet has mobile header constraint
assert(
  cssContent.includes('.mobile-header') || cssContent.includes('max-height: 52px') || cssContent.includes('max-height: 48px'),
  'styles.css MUST constrain mobile header height to prevent wrapping'
);

console.log('✅ Mobile Header & Quick Settings Menu test passed.');
