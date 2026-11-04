const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Mobile UI Navigation & HUD State Synchronization ---');

// Setup mock DOM environment
const domElements = {};
function getOrCreateElem(id) {
  if (!domElements[id]) {
    const classSet = new Set();
    let innerHTML = '';
    let textContent = '';
    const elem = {
      id,
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        toggle: (c) => { if (classSet.has(c)) classSet.delete(c); else classSet.add(c); },
        contains: (c) => classSet.has(c)
      },
      style: {},
      children: [],
      appendChild: function(child) { this.children.push(child); },
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    Object.defineProperty(elem, 'className', {
      get: () => Array.from(classSet).join(' '),
      set: function(val) {
        classSet.clear();
        String(val).split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      }
    });
    Object.defineProperty(elem, 'innerHTML', {
      get: () => innerHTML,
      set: function(val) {
        innerHTML = val;
        textContent = String(val).replace(/<[^>]*>/g, '');
      }
    });
    Object.defineProperty(elem, 'textContent', {
      get: () => textContent,
      set: function(val) {
        textContent = String(val);
        innerHTML = String(val);
      }
    });
    domElements[id] = elem;
  }
  return domElements[id];
}

const mockDocument = {
  body: {
    setAttribute: () => {},
    getAttribute: () => null,
    classList: { add: () => {}, remove: () => {}, contains: () => false }
  },
  getElementById: (id) => getOrCreateElem(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    innerHTML: '',
    textContent: '',
    style: {},
    children: [],
    appendChild: () => {}
  })
};

const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const context = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  assert: assert,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  Date: Date
};
context.window = context;

vm.createContext(context);

// Load required game files
const files = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/events.js',
  'game_modular/js/engine.js',
  'game_modular/js/actions.js',
  'game_modular/js/adopters.js',
  'game_modular/js/ui.js'
];

files.forEach(file => {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  vm.runInContext(code, context);
});

// Setup mock DOM elements corresponding to index.html
const modalIds = [
  'eventOverlayBox', 'candidateInterviewModal', 'mentorModal',
  'mentorArchiveModal', 'scenarioPickerModal', 'savedAlbumModal',
  'animalModal', 'endGameModal'
];
modalIds.forEach(id => getOrCreateElem(id).classList.add('hidden'));

const tabs = ['actions', 'supply', 'radar', 'base'];
tabs.forEach(t => {
  const btn = getOrCreateElem(`mobileTabBtn_${t}`);
  btn.classList.remove('active');
  const container = getOrCreateElem(`mobileTab_${t}`);
  if (t === 'actions') {
    btn.classList.add('active');
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
});

// 1. Test switchMobileTab
console.log('Test 1: switchMobileTab navigation');
assert(typeof context.switchMobileTab === 'function', 'switchMobileTab must be defined');

context.switchMobileTab('supply');
assert(getOrCreateElem('mobileTabBtn_supply').classList.contains('active'), 'mobileTabBtn_supply should be active');
assert(!getOrCreateElem('mobileTabBtn_actions').classList.contains('active'), 'mobileTabBtn_actions should not be active');
assert(!getOrCreateElem('mobileTab_supply').classList.contains('hidden'), 'mobileTab_supply should be visible (not hidden)');
assert(getOrCreateElem('mobileTab_actions').classList.contains('hidden'), 'mobileTab_actions should be hidden');

context.switchMobileTab('radar');
assert(getOrCreateElem('mobileTabBtn_radar').classList.contains('active'), 'mobileTabBtn_radar should be active');
assert(!getOrCreateElem('mobileTabBtn_supply').classList.contains('active'), 'mobileTabBtn_supply should not be active');
assert(!getOrCreateElem('mobileTab_radar').classList.contains('hidden'), 'mobileTab_radar should be visible');
assert(getOrCreateElem('mobileTab_supply').classList.contains('hidden'), 'mobileTab_supply should be hidden');

// 1b. Test Auto-switch to Actions tab on showEventModal
console.log('Test 1b: Auto-switch to Actions tab on showEventModal');
// Switch to 'supply' tab first
context.switchMobileTab('supply');
assert(getOrCreateElem('mobileTabBtn_supply').classList.contains('active'), 'Supply tab should initially be active');
assert(getOrCreateElem('mobileTab_actions').classList.contains('hidden'), 'Actions container should initially be hidden');

// Trigger showEventModal
assert(typeof context.showEventModal === 'function', 'showEventModal must be defined');
context.showEventModal('Критическое событие', 'Описание события для проверки вкладки', [
  { label: 'Понятно', action: () => {} }
]);

// Actions tab should now be automatically activated
assert(getOrCreateElem('mobileTabBtn_actions').classList.contains('active'), 'Actions tab button must be active after showEventModal');
assert(!getOrCreateElem('mobileTabBtn_supply').classList.contains('active'), 'Supply tab button must no longer be active');
assert(!getOrCreateElem('mobileTab_actions').classList.contains('hidden'), 'Actions container must be visible after showEventModal');
assert(getOrCreateElem('mobileTab_supply').classList.contains('hidden'), 'Supply container must be hidden');

// Clean up modal state
getOrCreateElem('eventOverlayBox').classList.add('hidden');
getOrCreateElem('eventOverlayBox').classList.remove('flex');
assert(getOrCreateElem('eventOverlayBox').classList.contains('hidden'), 'Event overlay should be hidden after cleanup');

// 2. Test renderHUD()
console.log('Test 2: renderHUD state binding and safe fills');
assert(typeof context.renderHUD === 'function', 'renderHUD must be defined');

// Set known state
context.state.player = {
  cash: 350,
  mental: 75,
  energy: 85,
  dailyLockedEnergy: 15
};
context.state.cash = 350;
context.state.mental = 75;
context.state.energy = 85;
context.state.animal = {
  name: 'Барсик',
  species: 'cat',
  health: 92
};
context.state.day = 2;
context.state.onboarding = { acutePhase: true };

context.renderHUD();

const cashValEl = getOrCreateElem('mobileHudCashVal');
const cashFillEl = getOrCreateElem('mobileHudCashFill');
assert(cashValEl.innerHTML.includes('350'), `Cash val should include 350, got: ${cashValEl.innerHTML}`);
assert(cashValEl.innerHTML.includes('BYN'), `Cash val must strictly use BYN, got: ${cashValEl.innerHTML}`);
assert(!cashValEl.innerHTML.includes('$') && !cashValEl.innerHTML.includes('USD'), 'Cash val must not contain $ or USD');
assert(cashFillEl.style.width && !cashFillEl.style.width.includes('NaN'), `Cash fill should be valid width, got: ${cashFillEl.style.width}`);

const mentalValEl = getOrCreateElem('mobileHudMentalVal');
const mentalFillEl = getOrCreateElem('mobileHudMentalFill');
assert(mentalValEl.textContent.includes('75%'), `Mental val should be 75%, got: ${mentalValEl.textContent}`);
assert.strictEqual(mentalFillEl.style.width, '75%');

const energyValEl = getOrCreateElem('mobileHudEnergyVal');
const energyFillEl = getOrCreateElem('mobileHudEnergyFill');
const lockedFillEl = getOrCreateElem('mobileHudLockedFill');
assert(energyValEl.innerHTML.includes('85') && energyValEl.innerHTML.includes('15🔒'), `Energy val should show 85/15🔒, got: ${energyValEl.innerHTML}`);
assert(energyFillEl.style.width && !energyFillEl.style.width.includes('NaN'), 'Energy fill must not be NaN');
assert(lockedFillEl.style.width && !lockedFillEl.style.width.includes('NaN'), 'Locked fill must not be NaN');

const healthValEl = getOrCreateElem('mobileHudHealthVal');
const healthFillEl = getOrCreateElem('mobileHudHealthFill');
assert(healthValEl.textContent.includes('92%'), `Health val should be 92%, got: ${healthValEl.textContent}`);
assert.strictEqual(healthFillEl.style.width, '92%');

const petNameEl = getOrCreateElem('mobilePetName');
assert.strictEqual(petNameEl.textContent, 'Барсик', 'Pet name should be Барсик');

const phaseChipEl = getOrCreateElem('mobilePhaseChip');
assert(phaseChipEl.textContent.includes('2/3'), `Phase chip in acute phase should show 2/3, got: ${phaseChipEl.textContent}`);

// 3. Test renderDeadlines() badge
console.log('Test 3: renderDeadlines mobile badge synchronization');
assert(typeof context.renderDeadlines === 'function', 'renderDeadlines must be defined');

const badgeEl = getOrCreateElem('mobileRadarBadge');
// With default state, calculate deadlines
context.state.supplies = { daysLeft: 2 }; // will trigger food deadline (<= 3)
context.state.zooshans = { voucherDebt: 500, voucherDaysLeft: 10, personalCardCollectedBYN: 0 };
context.renderDeadlines();
assert(Number(badgeEl.textContent) > 0, `Badge should display count > 0, got: ${badgeEl.textContent}`);
assert(!badgeEl.classList.contains('hidden'), 'Badge should not be hidden when count > 0');

// Test zero deadlines hides badge
context.state.supplies = { daysLeft: 14 };
context.state.zooshans = { voucherDebt: 0, personalCardCollectedBYN: 0 };
context.state.animal = { activeCount: 0, count: 0, dewormStage: 0, ageDays: 100 };
context.state.day = 15; // day % 30 != 0, no salary today
context.state.trialAnimals = [];
context.state.maneuver = null;
context.state.escapeQuest = null;
context.renderDeadlines();
// When items count or state.deadlines is 0
context.state.deadlines = [];
context.renderDeadlines();
assert.strictEqual(badgeEl.textContent, '0', 'Badge text should be 0 when no deadlines');
assert(badgeEl.classList.contains('hidden'), 'Badge should have class hidden when count is 0');

// Test state.deadlines array filter
context.state.deadlines = [
  { id: 'd1', resolved: false, completed: false },
  { id: 'd2', resolved: true, completed: false },
  { id: 'd3', resolved: false, completed: true },
  { id: 'd4', resolved: false, completed: false }
];
context.renderDeadlines();
assert.strictEqual(badgeEl.textContent, '2', 'Badge should count only unresolved/uncompleted deadlines');
assert(!badgeEl.classList.contains('hidden'), 'Badge should be visible when count > 0');

// Reset state.deadlines
delete context.state.deadlines;

// 4. Test Speed controls & acute phase button
console.log('Test 4: Speed and acute phase synchronization');
// In acute phase (day <= 3)
context.state.day = 2;
context.state.onboarding = { acutePhase: true };
if (typeof context.updateTimeControlsVisibility === 'function') {
  context.updateTimeControlsVisibility();
} else {
  context.renderHUD();
}

const btnAcute = getOrCreateElem('mobileBtnAdvanceAcuteDay');
const speedGroup = getOrCreateElem('mobileSpeedControls');
assert(!btnAcute.classList.contains('hidden'), 'mobileBtnAdvanceAcuteDay must be visible in acute phase');
assert(speedGroup.classList.contains('hidden'), 'mobileSpeedControls must be hidden in acute phase');

// In calm phase (day 4+)
context.state.day = 4;
context.state.onboarding = { acutePhase: false };
context.state.currentSeason = 'summer';
if (typeof context.updateTimeControlsVisibility === 'function') {
  context.updateTimeControlsVisibility();
} else {
  context.renderHUD();
}
assert(btnAcute.classList.contains('hidden'), 'mobileBtnAdvanceAcuteDay must be hidden in calm phase');
assert(!speedGroup.classList.contains('hidden'), 'mobileSpeedControls must be visible in calm phase');

context.renderHUD();
const calmChip = getOrCreateElem('mobilePhaseChip');
assert(calmChip.textContent.includes('Лето'), `Phase chip in calm phase should show season, got: ${calmChip.textContent}`);

// Test setSpeed updates active class on mobile buttons
context.setSpeed(2);
assert(getOrCreateElem('mobileBtnSpeed2').classList.contains('active'), 'mobileBtnSpeed2 should be active when speed=2');
assert(!getOrCreateElem('mobileBtnSpeed0').classList.contains('active'), 'mobileBtnSpeed0 should not be active when speed=2');

context.setSpeed(5);
assert(getOrCreateElem('mobileBtnSpeed5').classList.contains('active'), 'mobileBtnSpeed5 should be active when speed=5');
assert(!getOrCreateElem('mobileBtnSpeed2').classList.contains('active'), 'mobileBtnSpeed2 should not be active when speed=5');

context.setSpeed(0);
assert(getOrCreateElem('mobileBtnSpeed0').classList.contains('active'), 'mobileBtnSpeed0 should be active when speed=0');
assert(!getOrCreateElem('mobileBtnSpeed5').classList.contains('active'), 'mobileBtnSpeed5 should not be active when speed=0');

// 5. Test Edge Cases: fallback pet name, clamp values, NaN prevention
console.log('Test 5: Edge cases, clamp values, NaN prevention');
context.state.player = {
  cash: -10,
  mental: 120,
  energy: -5,
  dailyLockedEnergy: 200
};
context.state.animal = {
  health: -20
  // petName and name missing
};
context.renderHUD();

const clampedCashFill = getOrCreateElem('mobileHudCashFill');
assert.strictEqual(clampedCashFill.style.width, '0%', 'Negative cash fill should clamp to 0%');

const clampedMentalFill = getOrCreateElem('mobileHudMentalFill');
assert.strictEqual(clampedMentalFill.style.width, '100%', 'Over 100 mental fill should clamp to 100%');

const clampedHealthFill = getOrCreateElem('mobileHudHealthFill');
assert.strictEqual(clampedHealthFill.style.width, '0%', 'Negative health fill should clamp to 0%');

const fallbackPetNameEl = getOrCreateElem('mobilePetName');
assert.strictEqual(fallbackPetNameEl.textContent, 'Найденыш', 'Missing pet name should fallback to Найденыш');

// Test unnamed litter title parity on mobile header
context.state.animal = { count: 3, species: 'cat' };
context.renderHUD();
assert.strictEqual(fallbackPetNameEl.textContent, 'Выводок котят (3 шт.)', 'Unnamed cat litter should format properly');

context.state.animal = { count: 4, species: 'dog' };
context.renderHUD();
assert.strictEqual(fallbackPetNameEl.textContent, 'Выводок щенков (4 шт.)', 'Unnamed dog litter should format properly');

console.log('✅ ALL MOBILE UI SYNC TESTS PASSED!');
