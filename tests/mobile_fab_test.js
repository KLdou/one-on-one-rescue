const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Floating Time Action Dock ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../game_modular/index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, '../game_modular/css/styles.css'), 'utf-8');
const uiContent = fs.readFileSync(path.join(__dirname, '../game_modular/js/ui.js'), 'utf-8');
const engineContent = fs.readFileSync(path.join(__dirname, '../game_modular/js/engine.js'), 'utf-8');

// 1. Mobile time dock exists in index.html
assert(
  htmlContent.includes('id="mobileTimeDock"'),
  'index.html MUST contain id="mobileTimeDock"'
);
assert(
  htmlContent.includes('id="mobileBtnAdvanceAcuteDay"'),
  'index.html MUST contain id="mobileBtnAdvanceAcuteDay"'
);

// 2. CSS styles define .mobile-time-dock with bottom placement
assert(
  cssContent.includes('.mobile-time-dock') || cssContent.includes('#mobileTimeDock'),
  'styles.css MUST style .mobile-time-dock'
);

// 3. engine.js / ui.js updates mobile time controls in updateSpeedButtonsUI
assert(
  engineContent.includes('mobileBtnAdvanceAcuteDay') || uiContent.includes('mobileBtnAdvanceAcuteDay'),
  'engine.js/ui.js MUST sync mobile dock buttons in updateSpeedButtonsUI'
);

console.log('✅ Mobile Floating Time Action Dock test passed.');
