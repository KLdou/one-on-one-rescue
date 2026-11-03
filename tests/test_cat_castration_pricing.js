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
    'logEntries'
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
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    clearInterval: () => {}
  };
  context.window = context;

  vm.createContext(context);
  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  return context;
}

console.log('--- Test 1: Config and Fallback synchronization ---');
const configJson = JSON.parse(fs.readFileSync('game_modular/data/config.json', 'utf8'));
assert.strictEqual(configJson.prices.castrateCat, 100, 'config.json should have prices.castrateCat === 100');
assert.strictEqual(configJson.prices.spayCat, 160, 'config.json should have prices.spayCat === 160');

const ctx = setupTestEnvironment();
assert(ctx.window.GAME_DATA && ctx.window.GAME_DATA.config, 'GAME_DATA.config must exist');
assert.strictEqual(ctx.window.GAME_DATA.config.prices.castrateCat, 100, 'data_loader.js inline GAME_DATA must have prices.castrateCat === 100');

console.log('--- Test 2: Male Cat Castration Pricing & Voucher Discount ---');
// Init state with a male cat
ctx.startNewRun(false);
ctx.state.zooshans.applicationSubmitted = true;
ctx.state.animal.species = 'cat';
ctx.state.animal.gender = 'male';
ctx.state.animal.ageCategory = 'adult';
ctx.state.animal.quarantineDaysDone = 14;
ctx.state.animal.isSterilized = false;
ctx.state.animal.hiddenState = ctx.state.animal.hiddenState || {};

let capturedButtons = null;
const origRenderButtonGrid = ctx.renderButtonGrid;
ctx.renderButtonGrid = (containerId, buttons) => {
  if (containerId === 'tabContent_vet') {
    capturedButtons = buttons;
  }
  if (origRenderButtonGrid) origRenderButtonGrid(containerId, buttons);
};

ctx.renderActionTabs();
assert(capturedButtons, 'Clinic items should be captured in renderButtonGrid');
const maleCatItem = capturedButtons.find(b => b.title && b.title.includes('Кастрация'));
assert(maleCatItem, 'Male cat procedure should be named "Кастрация", not "Стерилизация"');
assert.strictEqual(maleCatItem.costBYN, 80, 'Male cat castration with 20% voucher discount should be 80 BYN');
assert.strictEqual(maleCatItem.baseCostBYN, 100, 'Male cat castration base price should be 100 BYN');
assert.strictEqual(maleCatItem.badge, 'Кот', 'Male cat procedure badge should be "Кот"');

console.log('--- Test 3: Female Cat Sterilization Pricing & Voucher Discount ---');
ctx.state.animal.gender = 'female';
ctx.renderActionTabs();
const femaleCatItem = capturedButtons.find(b => b.title && b.title.includes('Стерилизация'));
assert(femaleCatItem, 'Female cat procedure should be named "Стерилизация"');
assert.strictEqual(femaleCatItem.costBYN, 128, 'Female cat spay with 20% voucher discount should be 128 BYN (160 * 0.8)');
assert.strictEqual(femaleCatItem.baseCostBYN, 160, 'Female cat spay base price should be 160 BYN');
assert.strictEqual(femaleCatItem.badge, 'Кошка', 'Female cat procedure badge should be "Кошка"');

console.log('--- Test 4: Pregnant Cat Emergency Sterilization Pricing ---');
ctx.state.animal.hiddenState.isPregnant = true;
ctx.renderActionTabs();
const pregnantCatItem = capturedButtons.find(b => b.title && b.title.includes('Экстренная стерилизация'));
assert(pregnantCatItem, 'Pregnant cat procedure should be named "Экстренная стерилизация"');
assert.strictEqual(pregnantCatItem.costBYN, 180, 'Pregnant cat emergency spay with 20% voucher discount should be 180 BYN (225 * 0.8)');
assert.strictEqual(pregnantCatItem.baseCostBYN, 225, 'Pregnant cat base price should be 225 BYN');
assert.strictEqual(pregnantCatItem.badge, 'Срочно', 'Pregnant cat procedure badge should be "Срочно"');

console.log('--- Test 5: Dog Sterilization Pricing ---');
ctx.state.animal.species = 'dog';
ctx.state.animal.gender = 'male'; // dogs remain unchanged per user request
ctx.state.animal.hiddenState.isPregnant = false;
ctx.renderActionTabs();
const dogItem = capturedButtons.find(b => b.title && b.title.includes('Стерилизация'));
assert(dogItem, 'Dog procedure should remain "Стерилизация"');
assert.strictEqual(dogItem.costBYN, 240, 'Dog sterilization with 20% voucher discount should be 240 BYN (300 * 0.8)');
assert.strictEqual(dogItem.baseCostBYN, 300, 'Dog base price should be 300 BYN');
assert.strictEqual(dogItem.badge, 'Собака', 'Dog procedure badge should be "Собака"');

console.log('✅ All castration and sterilization pricing tests passed!');
