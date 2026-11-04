const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// Setup mock browser environment
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const domElements = {};
function getOrCreateElem(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      classList: {
        _classes: new Set(),
        add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
        remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
        contains: function(c) { return this._classes.has(c); }
      },
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild: function(child) { this.children.push(child); },
      children: [],
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
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
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); }
    },
    style: {},
    innerHTML: '',
    textContent: '',
    appendChild: function(c) { this.children.push(c); },
    children: []
  })
};

const context = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  assert: assert,
  console: console,
  Math: Math,
  Date: Date,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  prompt: () => ''
};
context.window = context;

vm.createContext(context);

// Load game files in order
const jsFiles = [
  'data_loader.js',
  'state.js',
  'engine.js',
  'events.js',
  'actions.js',
  'adopters.js',
  'ui.js'
];

jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', 'game_modular', 'js', file);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: file });
});

console.log('Environment loaded successfully for Food Warning Modal Tests.');

// Hook showEventModal to capture modal data
vm.runInContext(`
  window.lastModalData = null;
  window.modalHistory = [];
  const origShowEventModal = window.showEventModal;
  window.showEventModal = function(title, desc, buttons) {
    window.lastModalData = { title, desc, buttons };
    window.modalHistory.push({ title, desc, buttons });
    if (typeof origShowEventModal === 'function') {
      try { origShowEventModal(title, desc, buttons); } catch (e) {}
    }
  };
`, context);

// Test 1: When food drops to <= 1, triggerSuppliesLowModal is invoked and pauses timer
vm.runInContext(`{
  startNewRun(false);
  state.animal.species = 'cat';
  state.animal.activeCount = 1;
  state.animal.totalCount = 1;
  state.animal.count = 1;
  state.supplies.daysLeft = 1;
  state.supplies.lastWarningDay = -1;
  state.zooshans.giftedFoodDaysLeft = 0;
  window.currentSpeed = 1;
  window.lastModalData = null;

  assert(typeof triggerSuppliesLowModal === 'function', 'triggerSuppliesLowModal must be defined');

  processDayTick();

  assert(window.lastModalData !== null, 'Modal should be shown when totalFood <= 1');
  assert(window.lastModalData.title.includes('КОРМ'), 'Modal title should mention food/supplies');
  assert.strictEqual(window.currentSpeed, 0, 'Timer must be stopped / paused when modal triggers');
  assert.strictEqual(state.supplies.lastWarningDay, state.day, 'lastWarningDay must be updated to current day');
  console.log('PASS: Test 1 - Food <= 1 triggers supplies low modal and pauses timer.');
}`, context);

// Test 2: Instant purchase deducts 65 BYN for cat / 120 BYN for dog, adds 14 days, no starvation penalty
vm.runInContext(`{
  // 2A: Cat
  startNewRun(false);
  state.animal.species = 'cat';
  state.animal.hiddenState = {};
  state.animal.health = 88;
  state.animal.activeCount = 1;
  state.animal.totalCount = 1;
  state.animal.count = 1;
  state.supplies.daysLeft = 0;
  state.supplies.lastWarningDay = -1;
  state.zooshans.giftedFoodDaysLeft = 0;
  state.cash = 100;
  const initialHealth = state.animal.health;
  window.lastModalData = null;

  processDayTick();
  assert(window.lastModalData !== null, 'Modal should trigger when daysLeft is 0');
  
  const buyBtn = window.lastModalData.buttons[0];
  assert(buyBtn, 'Should have instant buy button');
  assert(buyBtn.label.includes('65 BYN') || buyBtn.label.includes('14'), 'Buy button should indicate 65 BYN for cat');
  
  buyBtn.action();
  assert.strictEqual(state.cash, 35, 'Cash should be deducted by 65 BYN (100 - 65 = 35)');
  assert.strictEqual(state.supplies.daysLeft, 14, 'supplies.daysLeft should be incremented by 14');

  // Next tick consumes from new supplies without starvation penalty
  processDayTick();
  assert.strictEqual(state.animal.health, initialHealth, 'Health should not suffer starvation penalty after instant buy');
  assert.strictEqual(state.supplies.daysLeft, 13, 'Food consumed normally for 1 day');
  console.log('PASS: Test 2A - Instant buy for cat works (deducts 65 BYN, adds 14 days, avoids starvation).');

  // 2B: Dog
  startNewRun(false);
  state.animal.species = 'dog';
  state.animal.activeCount = 1;
  state.animal.totalCount = 1;
  state.animal.count = 1;
  state.supplies.daysLeft = 0;
  state.supplies.lastWarningDay = -1;
  state.zooshans.giftedFoodDaysLeft = 0;
  state.cash = 200;
  window.lastModalData = null;

  processDayTick();
  assert(window.lastModalData !== null, 'Modal should trigger for dog when daysLeft is 0');
  
  const dogBuyBtn = window.lastModalData.buttons[0];
  assert(dogBuyBtn.label.includes('120 BYN'), 'Dog buy button should indicate 120 BYN');
  dogBuyBtn.action();
  assert.strictEqual(state.cash, 80, 'Cash should be deducted by 120 BYN (200 - 120 = 80)');
  assert.strictEqual(state.supplies.daysLeft, 14, 'Dog supplies.daysLeft should be incremented by 14');
  console.log('PASS: Test 2B - Instant buy for dog works (deducts 120 BYN, adds 14 days).');
}`, context);

// Test 3: Insufficient cash when clicking instant purchase
vm.runInContext(`{
  startNewRun(false);
  state.animal.species = 'cat';
  state.supplies.daysLeft = 0;
  state.supplies.lastWarningDay = -1;
  state.cash = 20; // less than 65 BYN
  window.lastModalData = null;

  triggerSuppliesLowModal(true);
  assert(window.lastModalData !== null, 'triggerSuppliesLowModal should open modal');
  
  const buyBtn = window.lastModalData.buttons[0];
  buyBtn.action();

  assert.strictEqual(state.cash, 20, 'Cash must not be deducted into negative when insufficient funds');
  assert.strictEqual(state.supplies.daysLeft, 0, 'Supplies must not increase without payment');
  
  const logEntries = state.logs || [];
  const hasDangerLog = logEntries.some(l => (l.text && l.text.includes('Не хватает') && (l.type === 'danger' || l.type === 'warn')));
  assert(hasDangerLog, 'Log should contain warning/danger about insufficient funds');
  console.log('PASS: Test 3 - Insufficient funds prevents negative cash and logs warning.');
}`, context);

// Test 4: Second call on the same game day does not trigger duplicate modal
vm.runInContext(`{
  startNewRun(false);
  state.animal.species = 'cat';
  state.animal.activeCount = 1;
  state.animal.totalCount = 1;
  state.animal.count = 1;
  state.supplies.daysLeft = 1;
  state.supplies.lastWarningDay = -1;
  window.lastModalData = null;

  processDayTick();
  assert(window.lastModalData !== null, 'First tick triggers modal');
  assert.strictEqual(state.supplies.lastWarningDay, state.day, 'lastWarningDay is recorded');

  // Dismiss modal
  window.lastModalData = null;

  // Second call on the same day
  processDayTick();
  assert.strictEqual(window.lastModalData, null, 'Second tick on the same day must NOT trigger modal again');
  console.log('PASS: Test 4 - Spam protection prevents duplicate modal on the same day.');
}`, context);

// Test 5: Formula warning triggers appropriately for foster newborns when milkDaysLeft <= 1
vm.runInContext(`{
  startNewRun(false);
  state.animal.species = 'cat';
  state.animal.activeCount = 3;
  state.animal.totalCount = 3;
  state.animal.count = 3;
  state.zooshans.locationStatus = 'paid_foster';
  assert(!isAnimalAtPlayerHome(), 'Animal should not be at player home for foster test');

  state.newborn = {
    active: true,
    milkDaysLeft: 1,
    lastFormulaWarningDay: -1,
    knowsAboutFormula: true,
    fedToday: false,
    daysFedCount: 5
  };
  state.cash = 150;
  window.lastModalData = null;

  assert(typeof triggerFormulaLowModal === 'function', 'triggerFormulaLowModal must be defined');

  processDayTick();
  assert(window.lastModalData !== null, 'Formula low modal should trigger when milkDaysLeft <= 1');
  assert(window.lastModalData.title.includes('СМЕСЬ') || window.lastModalData.desc.includes('Babycat'), 'Modal should mention formula / Babycat');
  assert.strictEqual(state.newborn.lastFormulaWarningDay, state.day, 'lastFormulaWarningDay should be set');

  const formulaBtn = window.lastModalData.buttons[0];
  assert(formulaBtn && formulaBtn.label.includes('105 BYN'), 'Formula button should indicate 105 BYN');
  
  formulaBtn.action();
  assert.strictEqual(state.cash, 45, 'Cash should be deducted by 105 BYN (150 - 105 = 45)');
  assert(state.newborn.milkDaysLeft >= 14, 'milkDaysLeft should increase by at least 14 days');

  // Test duplicate check for formula
  window.lastModalData = null;
  state.newborn.milkDaysLeft = 1;
  processDayTick();
  assert.strictEqual(window.lastModalData, null, 'Formula modal must not trigger twice on the same day');
  console.log('PASS: Test 5 - Formula warning triggers for foster newborns and has spam protection.');
}`, context);

console.log('ALL TESTS PASSED SUCCESSFULLY!');
