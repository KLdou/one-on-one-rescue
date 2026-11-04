const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile DOM Structure in index.html ---');

const htmlPath = path.join(__dirname, '../game_modular/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// 1. Mobile Top Sticky Header
assert(
  html.includes('id="mobileTopSticky"') && html.includes('mobile-top-sticky'),
  'index.html MUST contain #mobileTopSticky with class .mobile-top-sticky'
);
assert(
  html.includes('id="mobilePetQuickBtn"') && html.includes('showAnimalModal()'),
  'index.html MUST contain #mobilePetQuickBtn calling showAnimalModal()'
);
assert(html.includes('id="mobilePetAvatar"'), 'index.html MUST contain #mobilePetAvatar');
assert(html.includes('id="mobilePetName"'), 'index.html MUST contain #mobilePetName');
assert(html.includes('id="mobileGameDay"'), 'index.html MUST contain #mobileGameDay');
assert(
  html.includes('id="mobilePhaseChip"') && html.includes('phase-chip'),
  'index.html MUST contain #mobilePhaseChip with class .phase-chip'
);
assert(
  html.includes('id="mobileSettingsBtn"') && html.includes('openMobileSettingsMenu()'),
  'index.html MUST contain #mobileSettingsBtn calling openMobileSettingsMenu()'
);

// 2. Compact 4-Resource HUD in Top Sticky
const hudElements = [
  { id: 'mobileHudCash', val: 'mobileHudCashVal', fill: 'mobileHudCashFill', fillClass: 'budget', tooltip: 'tooltip-cash' },
  { id: 'mobileHudMental', val: 'mobileHudMentalVal', fill: 'mobileHudMentalFill', fillClass: 'mental', tooltip: 'tooltip-mental' },
  { id: 'mobileHudEnergy', val: 'mobileHudEnergyVal', fill: 'mobileHudEnergyFill', fillClass: 'energy', tooltip: 'energy-tooltip' },
  { id: 'mobileHudHealth', val: 'mobileHudHealthVal', fill: 'mobileHudHealthFill', fillClass: 'health', tooltip: 'tooltip-health' }
];

hudElements.forEach(item => {
  assert(html.includes(`id="${item.id}"`), `index.html MUST contain #${item.id}`);
  assert(html.includes(`id="${item.val}"`), `index.html MUST contain #${item.val}`);
  assert(html.includes(`id="${item.fill}"`), `index.html MUST contain #${item.fill}`);
  assert(html.includes(item.fillClass), `index.html MUST contain fill class "${item.fillClass}"`);
  assert(html.includes(`toggleResourceTooltip('${item.tooltip}')`), `index.html MUST bind tooltip "${item.tooltip}"`);
});

// Energy dual segment locked fill
assert(
  html.includes('id="mobileHudLockedFill"') && html.includes('locked'),
  'index.html MUST contain #mobileHudLockedFill with fill class "locked"'
);

// 3. 4 Mobile Tabs Containers
const tabContainers = [
  'mobileTab_actions',
  'mobileTab_supply',
  'mobileTab_radar',
  'mobileTab_base'
];

tabContainers.forEach(tabId => {
  assert(html.includes(`id="${tabId}"`), `index.html MUST contain container #${tabId}`);
});

// 4. Mobile Bottom Dock
assert(
  html.includes('id="mobileBottomDock"') && html.includes('mobile-bottom-dock'),
  'index.html MUST contain #mobileBottomDock with class .mobile-bottom-dock'
);

// Time Controller inside dock
assert(
  html.includes('id="mobileBtnAdvanceAcuteDay"') && html.includes('advanceAcuteDay()'),
  'index.html MUST contain #mobileBtnAdvanceAcuteDay calling advanceAcuteDay()'
);
assert(html.includes('id="mobileSpeedControls"'), 'index.html MUST contain #mobileSpeedControls');

const speedButtons = [
  { id: 'mobileBtnSpeed0', speed: 0 },
  { id: 'mobileBtnSpeed1', speed: 1 },
  { id: 'mobileBtnSpeed2', speed: 2 },
  { id: 'mobileBtnSpeed5', speed: 5 }
];

speedButtons.forEach(btn => {
  assert(
    html.includes(`id="${btn.id}"`) && html.includes(`setSpeed(${btn.speed})`),
    `index.html MUST contain #${btn.id} calling setSpeed(${btn.speed})`
  );
});

// 4 Bottom Navigation Buttons & Badge
const navTabs = [
  { id: 'mobileTabBtn_actions', tab: 'actions' },
  { id: 'mobileTabBtn_supply', tab: 'supply' },
  { id: 'mobileTabBtn_radar', tab: 'radar' },
  { id: 'mobileTabBtn_base', tab: 'base' }
];

navTabs.forEach(nav => {
  assert(
    html.includes(`id="${nav.id}"`) && html.includes(`switchMobileTab('${nav.tab}')`),
    `index.html MUST contain #${nav.id} calling switchMobileTab('${nav.tab}')`
  );
});

assert(
  html.includes('id="mobileRadarBadge"') && html.includes('nav-badge'),
  'index.html MUST contain #mobileRadarBadge with class .nav-badge'
);

// 5. Desktop Layout Guards
assert(
  html.includes('hidden lg:grid') || html.includes('hidden lg:flex'),
  'index.html MUST hide duplicated desktop elements on mobile using hidden lg:*'
);
assert(
  html.includes('id="mobileTopSticky"') && html.includes('lg:hidden'),
  '#mobileTopSticky MUST include "lg:hidden" to hide on desktop'
);
assert(
  html.includes('id="mobileBottomDock"') && html.includes('lg:hidden'),
  '#mobileBottomDock MUST include "lg:hidden" to hide on desktop'
);

console.log('✅ Mobile DOM Structure in index.html passed.');
