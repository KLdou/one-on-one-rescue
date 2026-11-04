const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile Layout CSS Architecture & Theme Variables ---');

const cssPath = path.join(__dirname, '../game_modular/css/styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// 1. Verify CSS custom properties in :root for mobile layout tokens
const requiredRootVars = [
  '--top-hud-height',
  '--bottom-dock-height',
  '--bg-surface',
  '--text-main',
  '--accent-primary'
];

requiredRootVars.forEach(v => {
  assert(
    cssContent.includes(v),
    `styles.css MUST define custom property "${v}" in :root`
  );
});

// 2. Verify scoped theme variables in .mobile-top-sticky and .mobile-bottom-dock
assert(
  cssContent.includes('.mobile-top-sticky') && cssContent.includes('--bg-elevated: #282d39'),
  'styles.css MUST scope --bg-elevated: #282d39 to mobile containers'
);
assert(
  cssContent.includes('.mobile-bottom-dock') && cssContent.includes('--border-subtle: rgba(255, 255, 255, 0.08)'),
  'styles.css MUST scope --border-subtle to mobile containers'
);

// 3. Verify Mobile HUD and Dock CSS selectors
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

// 4. Verify desktop guards (>= 1024px) hide mobile top sticky and bottom dock without hacky :root overrides
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

// Ensure no hacky desktop :root restore override
assert(
  !desktopMediaBlock.includes('--bg-elevated: #EFE8DA'),
  'styles.css should not need a desktop :root restore hack once dark palette is properly scoped'
);

console.log('✅ Mobile Layout CSS Architecture & Theme Variables test passed.');
