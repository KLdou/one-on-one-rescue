const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Layout CSS Architecture & Theme Variables ---');

const cssPath = path.join(__dirname, '../game_modular/css/styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// 1. Verify CSS custom properties in :root
const requiredRootVars = [
  '--top-hud-height',
  '--bottom-dock-height',
  '--bg-surface',
  '--bg-elevated',
  '--text-main',
  '--text-muted',
  '--accent-primary',
  '--border-subtle'
];

requiredRootVars.forEach(v => {
  assert(
    cssContent.includes(v),
    `styles.css MUST define custom property "${v}" in :root`
  );
});

// 2. Verify Mobile HUD and Dock CSS selectors
const requiredSelectors = [
  '.mobile-top-sticky',
  '.app-header',
  '.pet-quick-btn',
  '.pet-meta',
  '.pet-name',
  '.game-day',
  '.header-badges',
  '.phase-chip',
  '.hud-bar',
  '.hud-item',
  '.hud-row',
  '.hud-val',
  '.hud-progress',
  '.fill.budget',
  '.fill.mental',
  '.fill.energy',
  '.fill.locked',
  '.fill.health',
  '.mobile-main-content',
  '.mobile-bottom-dock',
  '.time-controller-bar',
  '.speed-controls',
  '.speed-btn',
  '.end-day-btn',
  '.bottom-nav',
  '.nav-tab',
  '.nav-icon',
  '.nav-badge'
];

requiredSelectors.forEach(selector => {
  assert(
    cssContent.includes(selector),
    `styles.css MUST define selector "${selector}"`
  );
});

// 3. Verify desktop guards (>= 1024px) hide mobile top sticky and bottom dock
assert(
  cssContent.includes('@media (min-width: 1024px)'),
  'styles.css MUST contain desktop media query "@media (min-width: 1024px)"'
);

const desktopMediaQueryIndex = cssContent.indexOf('@media (min-width: 1024px)');
const desktopMediaBlock = cssContent.substring(desktopMediaQueryIndex);

assert(
  desktopMediaBlock.includes('.mobile-top-sticky') &&
  desktopMediaBlock.includes('.mobile-bottom-dock') &&
  desktopMediaBlock.includes('display: none'),
  'styles.css MUST hide .mobile-top-sticky and .mobile-bottom-dock with display: none in @media (min-width: 1024px)'
);

console.log('✅ Mobile Layout CSS Architecture & Theme Variables test passed.');
