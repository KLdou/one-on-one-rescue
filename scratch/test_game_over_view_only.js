// scratch/test_game_over_view_only.js
const fs = require('fs');

// Minimal DOM mock
class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (...cls) => {
        cls.forEach(c => this.classList._classes.add(c));
        this.className = Array.from(this.classList._classes).join(' ');
      },
      remove: (...cls) => {
        cls.forEach(c => this.classList._classes.delete(c));
        this.className = Array.from(this.classList._classes).join(' ');
      },
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c)
    };
    this.style = {};
    this.attributes = {};
    this.disabled = false;
    this.title = '';
    this.textContent = '';
    this.innerHTML = '';
    this.children = [];
    this.onclick = null;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) { this.children.push(child); }
}

const elements = new Map();
function getOrCreateElement(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(id, tag));
  }
  return elements.get(id);
}

global.window = global;
global.document = {
  body: new MockElement('body', 'body'),
  getElementById: (id) => getOrCreateElement(id),
  createElement: (tag) => new MockElement('', tag),
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};

// Load modular files
eval(fs.readFileSync('game_modular/js/data_loader.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/state.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/engine.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/events.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/actions.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/adopters.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/ui.js', 'utf8'));

// Initialize mock elements required by UI
const idsToMock = [
  'dayCounter', 'calendarDateBadge', 'acutePhaseBadge', 'seasonBadge', 'seasonEffects',
  'headerPetName', 'headerCoatBadge', 'headerAlbumCount', 'petStatusSummary',
  'statBudget', 'statMental', 'statEnergy', 'energyReserveBadge', 'statAnimalHealth',
  'mentalBar', 'energyBar', 'healthBar', 'healthStatusText', 'energy-tooltip', 'energyDrainBreakdown',
  'newbornUrgentBanner', 'btnCowMilkTrap', 'btnBuyFormula', 'btnFeedNewborns', 'milkSupplyTag',
  'btnTogglePaidFoster', 'milkSupplyBox', 'milkSupplyLabel', 'btnSidebarBuyFormula',
  'applicationStatusBadge', 'cardLimitBar', 'cardCollectedCount', 'btnClinicPartner', 'btnClinicMajor',
  'giftedFoodBadge', 'giftThankYouBanner', 'fosterStatusBadge', 'playerTagsContainer', 'petSvgContainer',
  'animalSpeciesBadge', 'animalTitle', 'coatPopularityBadge', 'animalDescription', 'visibleStateText',
  'qBadge', 'parasitesBadge', 'sterilBadge', 'woodBadge', 'ringwormBadge', 'socialBadge',
  'vaccineBadge', 'actionsTabContainer', 'tabBtn_vet', 'tabBtn_zooshans', 'tabBtn_care',
  'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'grid_vet', 'grid_zooshans', 'grid_care',
  'btnAdvanceAcuteDay', 'speedButtonsGroup', 'btnSpeed0', 'btnSpeed1', 'btnSpeed2', 'btnSpeed5',
  'btnFastForward', 'tickIndicator', 'deadlinesList', 'gameLog', 'endGameModal', 'endModalBadge',
  'endModalTitle', 'endModalDescription', 'endModalMistakesCard', 'endModalMistakesText',
  'statDays', 'statPersonalSpent', 'statVoucherUsed', 'statFilteredCalls',
  'storyCardTitle', 'storyCardSubtitle', 'storyCardStatDays', 'storyCardStatPersonal',
  'storyCardStatVoucher', 'storyCardStatFiltered', 'storyCardStatAlbum',
  'endGameOverviewBanner', 'endBannerTitle', 'endBannerSubtitle', 'animalModal', 'savedAlbumModal',
  'eventOverlayBox', 'candidateInterviewModal', 'candidateActionButtons',
  'slot2ClosedView', 'slot2OpenView', 'candidateSlot2Box',
  'slot3ClosedView', 'slot3OpenView', 'candidateSlot3Box'
];
idsToMock.forEach(id => getOrCreateElement(id));

// 1. Start a game
startNewRun();
console.log('--- Test: Game Started ---');
console.log('Day:', state.day);
console.log('Game over status:', state.gameOver);

// 2. Trigger Game Over
console.log('\n--- Triggering Game Over (Defeat) ---');
triggerEndGame(false, 'Трагический исход', 'Подопечный погиб из-за неправильных действий.');
console.log('state.gameOver after triggerEndGame:', state.gameOver);
if (!state.gameOver) throw new Error('state.gameOver must be true');

// 3. User closes end modal to inspect diary and history
console.log('\n--- User closes end modal to review diary ---');
closeEndGameModal();

// Check endGameOverviewBanner
const banner = getOrCreateElement('endGameOverviewBanner');
console.log('endGameOverviewBanner hidden?:', banner.classList.contains('hidden'));
if (banner.classList.contains('hidden')) throw new Error('endGameOverviewBanner must not have hidden class');

// 4. Test button locking in Central Grid (Tabs)
console.log('\n--- Testing Action Card Grid Lock ---');
const dummyCards = [
  { id: 'c1', title: 'Осмотр Вуда', costBYN: 50, costEnergy: 12, state: 'active', onClick: () => console.log('FAIL: clicked c1') },
  { id: 'c2', title: 'Вакцинация', costBYN: 60, costEnergy: 10, state: 'locked', statusText: 'Требуется 2/2 глистогонки' },
  { id: 'c3', title: 'Операция проведена', state: 'completed' }
];
const grid = getOrCreateElement('grid_vet');
renderButtonGrid('grid_vet', dummyCards);

console.log('Total cards rendered:', grid.children.length);
if (grid.children.length !== 3) throw new Error('Must render 3 cards');

grid.children.forEach((btn, idx) => {
  console.log(`Card ${idx} [${dummyCards[idx].title}]: disabled=${btn.disabled}, onclick=${btn.onclick}, title="${btn.title}"`);
  if (!btn.disabled) throw new Error(`Card ${idx} must be disabled!`);
  if (btn.onclick !== null) throw new Error(`Card ${idx} onclick must be null!`);
  if (!btn.className.includes('cursor-not-allowed')) throw new Error(`Card ${idx} must have cursor-not-allowed class`);
});

// 5. Test Day Advancement and Speed Controls
console.log('\n--- Testing Controls Lock ---');
const dayBefore = state.day;
advanceAcuteDay();
if (state.day !== dayBefore) throw new Error('advanceAcuteDay must not advance day when gameOver is true');

fastForwardCalmDays();
if (state.day !== dayBefore) throw new Error('fastForwardCalmDays must not advance day when gameOver is true');

setSpeed(2);
if (currentSpeed !== 0) throw new Error('setSpeed must not change speed when gameOver is true');

const btnAcute = getOrCreateElement('btnAdvanceAcuteDay');
console.log('btnAdvanceAcuteDay disabled:', btnAcute.disabled);
if (!btnAcute.disabled) throw new Error('btnAdvanceAcuteDay must be disabled');

const btnFast = getOrCreateElement('btnFastForward');
console.log('btnFastForward disabled:', btnFast.disabled);
if (!btnFast.disabled) throw new Error('btnFastForward must be disabled');

['btnSpeed0', 'btnSpeed1', 'btnSpeed2', 'btnSpeed5'].forEach(sId => {
  const el = getOrCreateElement(sId);
  if (!el.disabled) throw new Error(`${sId} must be disabled`);
});

// 6. Test Sidebar and Quick Action Controls
const btnClinicPartner = getOrCreateElement('btnClinicPartner');
const btnClinicMajor = getOrCreateElement('btnClinicMajor');
const btnFosterToggle = getOrCreateElement('btnTogglePaidFoster');
const btnSidebarFormula = getOrCreateElement('btnSidebarBuyFormula');

console.log('btnClinicPartner disabled:', btnClinicPartner.disabled);
console.log('btnClinicMajor disabled:', btnClinicMajor.disabled);
console.log('btnFosterToggle disabled:', btnFosterToggle.disabled);
console.log('btnSidebarFormula disabled:', btnSidebarFormula.disabled);

if (!btnClinicPartner.disabled || !btnClinicMajor.disabled) throw new Error('Clinic mode buttons must be disabled');
if (!btnFosterToggle.disabled) throw new Error('btnTogglePaidFoster must be disabled');
if (!btnSidebarFormula.disabled) throw new Error('btnSidebarBuyFormula must be disabled');

// 7. Test Logic Guard Functions
console.log('\n--- Testing Logic Guard Functions ---');
const energyBefore = state.energy;
const spendRes = spendEnergy(5);
if (spendRes !== false || state.energy !== energyBefore) throw new Error('spendEnergy must return false and not deduct energy');

const cashBefore = state.cash;
const billRes = payVetBill(50, false, 'Тест');
if (billRes !== false || state.cash !== cashBefore) throw new Error('payVetBill must return false and not deduct cash');

const oldPetName = state.animal.petName;
actionRollRandomPetName();
if (state.animal.petName !== oldPetName) throw new Error('actionRollRandomPetName must not change petName');

actionSetPetName('ТестовоеИмя');
if (state.animal.petName !== oldPetName) throw new Error('actionSetPetName must not change petName');

const fosterLocBefore = state.zooshans.locationStatus;
actionTogglePaidFoster();
if (state.zooshans.locationStatus !== fosterLocBefore) throw new Error('actionTogglePaidFoster must do nothing');

actionInspectCandidateSlot(2);
actionRefuseCandidate();
actionAcceptCandidate(false);
actionCancelTrialReturn('dummy');
actionReceiveGreetingFromHome('dummy');

console.log('\n✅ ALL VIEW-ONLY LOCK CHECKS PASSED SUCCESSFULLY!');
