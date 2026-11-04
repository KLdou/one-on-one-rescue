const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function setupTestEnvironment() {
  const codeFiles = [
    'game_modular/js/data_loader.js',
    'game_modular/js/state.js',
    'game_modular/js/engine.js',
    'game_modular/js/events.js',
    'game_modular/js/actions.js',
    'game_modular/js/adopters.js',
    'game_modular/js/ui.js'
  ];

  const domElements = {};
  const mockElement = (id = '') => ({
    id,
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    setAttribute: () => {},
    removeAttribute: () => {},
    addEventListener: () => {},
    appendChild: () => {},
    removeChild: () => {},
    focus: () => {},
    children: []
  });

  const ids = [
    'cashValue', 'mentalBar', 'mentalValue', 'energyBar', 'energyValue', 'healthBar', 'healthValue',
    'foodStockDays', 'feedReserveDays', 'calendarDay', 'activeCuratorName', 'activePetTitle', 'activePetBreed',
    'activePetCoat', 'activePetArchetype', 'activePetAge', 'activePetStory', 'zooshansDebtLimit', 'zooshansDebtValue',
    'modalContainer', 'modalTitle', 'modalDescription', 'modalChoices', 'actionButtonsContainer', 'activePetBadge',
    'logEntries', 'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'tab1Badge', 'tab2Badge', 'tab3Badge',
    'deadlinesRadarList'
  ];
  ids.forEach(id => {
    domElements[id] = mockElement(id);
  });

  const context = {
    console,
    window: {},
    document: {
      getElementById: (id) => domElements[id] || (domElements[id] = mockElement(id)),
      createElement: (tag) => mockElement(tag),
      body: mockElement('body'),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    setInterval: () => 1,
    clearInterval: () => {},
    Math: Object.create(Math)
  };
  context.window = context;

  vm.createContext(context);
  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  return context;
}

console.log('--- TEST: 3-Day Maneuver Foster Search Lock & Resolution ---');

const ctx = setupTestEnvironment();
ctx.startNewRun(false);

let capturedZooButtons = null;
const origRenderButtonGrid = ctx.renderButtonGrid;
ctx.renderButtonGrid = (containerId, buttons) => {
  if (containerId === 'tabContent_zooshans') {
    capturedZooButtons = buttons;
  }
  if (origRenderButtonGrid) origRenderButtonGrid(containerId, buttons);
};

// ---------------------------------------------------------
// Test 1: During 3-day maneuver, SOS-пост: Поиск передержки must be active
// ---------------------------------------------------------
console.log('Checking 3-day maneuver active state...');
ctx.state.energy = 50;
ctx.state.maneuver = { active: true, daysRemaining: 3 };
ctx.state.zooshans.locationStatus = 'maneuver_adopters';
if (ctx.state.animal) {
  ctx.state.animal.inStationaryDaysLeft = 0;
}

ctx.renderActionTabs();
assert(capturedZooButtons, 'tabContent_zooshans buttons must be captured');
const maneuverButton = capturedZooButtons.find(b => b.title === 'SOS-пост: Поиск передержки');
assert(maneuverButton, 'SOS foster button must exist in tabContent_zooshans');

assert.strictEqual(maneuverButton.state, 'active', 'Button state must be active during maneuver');
assert.strictEqual(maneuverButton.badge, 'Срочно (маневр 3 дн.)', 'Badge must indicate urgent 3-day maneuver');
assert.strictEqual(maneuverButton.costEnergy, 15, 'Cost energy must be 15');
assert.strictEqual(maneuverButton.statusText, '', 'Status text should be empty when active');
assert.strictEqual(maneuverButton.sub, 'Срочный поиск новой передержки: ручки согласились подержать питомца лишь 3 дня!', 'Subtext must describe maneuver urgency');
assert.strictEqual(typeof maneuverButton.onClick, 'function', 'onClick must be a callable function');

// ---------------------------------------------------------
// Test 2: Finding a volunteer foster clears maneuver active flag
// ---------------------------------------------------------
console.log('Checking volunteer foster placement clears maneuver...');
let rollIndex = 0;
// First call roll < fosterChance (0.30), second call < 0.30 (volunteer foster)
const fixedRollsVolunteer = [0.1, 0.1];
ctx.Math.random = () => fixedRollsVolunteer[rollIndex++ % fixedRollsVolunteer.length];

maneuverButton.onClick();
assert.strictEqual(ctx.state.maneuver.active, false, 'Maneuver active flag must be set to false upon volunteer foster placement');
assert.strictEqual(ctx.state.zooshans.locationStatus, 'social_foster_volunteer', 'Location should be social_foster_volunteer');

// ---------------------------------------------------------
// Test 3: Finding a novice foster also clears maneuver active flag
// ---------------------------------------------------------
console.log('Checking novice foster placement clears maneuver...');
ctx.state.maneuver = { active: true, daysRemaining: 3 };
ctx.state.zooshans.locationStatus = 'maneuver_adopters';
ctx.state.energy = 50;

rollIndex = 0;
// First call roll < fosterChance (0.30), second call >= 0.30 (novice foster)
const fixedRollsNovice = [0.1, 0.6];
ctx.Math.random = () => fixedRollsNovice[rollIndex++ % fixedRollsNovice.length];

ctx.actionSearchSocialFosterPost();
assert.strictEqual(ctx.state.maneuver.active, false, 'Maneuver active flag must be set to false upon novice foster placement');
assert.strictEqual(ctx.state.zooshans.locationStatus, 'social_foster_novice', 'Location should be social_foster_novice');

// Restore Math.random
ctx.Math.random = Math.random;

// ---------------------------------------------------------
// Test 4: When animal is already on foster and not in maneuver, button is completed
// ---------------------------------------------------------
console.log('Checking completed state when pet is already on foster without maneuver...');
ctx.state.maneuver = { active: false, daysRemaining: 0 };
ctx.state.zooshans.locationStatus = 'paid_foster';
if (ctx.state.animal) {
  ctx.state.animal.inStationaryDaysLeft = 0;
}

ctx.renderActionTabs();
const fosterButton = capturedZooButtons.find(b => b.title === 'SOS-пост: Поиск передержки');
assert(fosterButton, 'SOS foster button must exist');
assert.strictEqual(fosterButton.state, 'completed', 'Button state must be completed when already on foster');
assert.strictEqual(fosterButton.badge, 'На передержке', 'Badge must be "На передержке"');
assert.strictEqual(fosterButton.statusText, '✓ Подопечный на передержке', 'Status text must indicate completed foster');
assert.strictEqual(fosterButton.costEnergy, 0, 'Cost energy must be 0 when completed');
assert.strictEqual(fosterButton.onClick, null, 'onClick must be null when completed');

// ---------------------------------------------------------
// Test 5: When animal is at player home, button is active with "Соцсети" badge
// ---------------------------------------------------------
console.log('Checking active state when pet is at player home...');
ctx.state.maneuver = { active: false, daysRemaining: 0 };
ctx.state.zooshans.locationStatus = 'home_floor';
if (ctx.state.animal) {
  ctx.state.animal.inStationaryDaysLeft = 0;
}

ctx.renderActionTabs();
const homeButton = capturedZooButtons.find(b => b.title === 'SOS-пост: Поиск передержки');
assert(homeButton, 'SOS foster button must exist');
assert.strictEqual(homeButton.state, 'active', 'Button state must be active when at player home');
assert.strictEqual(homeButton.badge, 'Соцсети', 'Badge must be "Соцсети"');
assert.strictEqual(homeButton.costEnergy, 15, 'Cost energy must be 15');
assert.strictEqual(homeButton.statusText, '', 'Status text must be empty');
assert.strictEqual(typeof homeButton.onClick, 'function', 'onClick must be a callable function');

// ---------------------------------------------------------
// Test 6: In stationary, button must be locked
// ---------------------------------------------------------
console.log('Checking locked state when pet is in clinic stationary...');
ctx.state.animal.inStationaryDaysLeft = 3;

ctx.renderActionTabs();
const stationaryButton = capturedZooButtons.find(b => b.title === 'SOS-пост: Поиск передержки');
assert(stationaryButton, 'SOS foster button must exist');
assert.strictEqual(stationaryButton.state, 'locked', 'Button state must be locked in stationary');
assert.strictEqual(stationaryButton.badge, 'В стационаре', 'Badge must be "В стационаре"');
assert.strictEqual(stationaryButton.costEnergy, 0, 'Cost energy must be 0 when locked');
assert.strictEqual(stationaryButton.statusText, '🔒 В стационаре клиники', 'Status text must indicate stationary lock');
assert.strictEqual(stationaryButton.onClick, null, 'onClick must be null when locked');

console.log('✅ All 3-Day Maneuver Foster Search tests passed successfully!');
