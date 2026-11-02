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
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild: () => {},
      children: []
    };
  }
  return domElements[id];
}

const mockDocument = {
  body: {
    setAttribute: () => {},
    getAttribute: () => null,
    classList: { add: () => {}, remove: () => {} }
  },
  getElementById: (id) => getOrCreateElem(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    classList: { add: () => {}, remove: () => {} },
    innerHTML: '',
    textContent: '',
    appendChild: () => {},
    children: []
  })
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
  Math: Math
};
context.window = context;

vm.createContext(context);

// Load game files in proper order
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

console.log('--- Running Volunteer Mechanics & Formula Cutoff Tests ---');

// Test 1: Babycat formula cutoff at >= 60 days
context.startNewRun(false);
context.state.animal.ageDays = 65;
context.state.animal.ageCategory = 'kitten';
context.state.cash = 500;
context.state.newborn.milkDaysLeft = 0;

const initialCash = context.state.cash;
context.buyBabycatFormula();
assert.strictEqual(context.state.cash, initialCash, 'Cash should not be deducted when kittens are >= 60 days');
assert.strictEqual(context.state.newborn.milkDaysLeft, 0, 'Milk days should not increase when kittens are >= 60 days');
console.log('✓ Test 1: Babycat formula blocked at 60+ days passed');

// Test 2: Wood\'s lamp check on experienced volunteer takeover
context.startNewRun(false);
context.state.animal.examinedWood = false;
context.state.animal.hiddenState.hasRingworm = true;
context.handleVolunteerTakeoverExamination('Таня');

assert.strictEqual(context.state.animal.examinedWood, true, 'Animal should be examined by Wood lamp on volunteer takeover');
assert.strictEqual(context.state.animal.knownRingworm, true, 'Ringworm should be discovered by volunteer Wood examination');
console.log('✓ Test 2: Wood lamp examination and ringworm detection on takeover passed');

// Test 3: Flea market deworming supply
context.startNewRun(false);
context.state.energy = 20;
context.state.cash = 100;
context.state.animal.dewormStage = 0;

context.provideVolunteerDeworming('flea_market');
assert.strictEqual(context.state.energy, 10, 'Flea market should deduct 10 energy');
assert.strictEqual(context.state.cash, 100, 'Flea market should cost 0 BYN');
assert.strictEqual(context.state.animal.dewormStage, 1, 'Stage 1 deworming administered by volunteer');
assert.strictEqual(context.state.animal.volunteerHandlesDeworming, true, 'Volunteer handles deworming flag is active');
console.log('✓ Test 3: Flea market deworming supply passed');

// Test 4: Clinic deworming supply
context.startNewRun(false);
context.state.energy = 20;
context.state.cash = 100;
context.state.animal.dewormStage = 0;

context.provideVolunteerDeworming('clinic');
assert.strictEqual(context.state.energy, 20, 'Clinic supply should deduct 0 energy');
assert.strictEqual(context.state.cash, 74, 'Clinic supply should deduct 26 BYN');
assert.strictEqual(context.state.animal.dewormStage, 1, 'Stage 1 deworming administered by volunteer');
assert.strictEqual(context.state.animal.volunteerHandlesDeworming, true, 'Volunteer handles deworming flag is active');
console.log('✓ Test 4: Clinic deworming supply passed');

// Test 5: Volunteer automatically gives stage 2 deworming after 10 days
context.startNewRun(false);
context.state.animal.volunteerHandlesDeworming = true;
context.state.animal.dewormStage = 1;
context.state.animal.daysSinceDeworm1 = 9;

// Advance tick to reach day 10
context.processDayTick();
assert.strictEqual(context.state.animal.dewormStage, 2, 'Volunteer should auto-administer stage 2 deworming on day 10');
assert.strictEqual(context.state.animal.volunteerHandlesDeworming, false, 'Volunteer flag reset after completing deworming');
console.log('✓ Test 5: Volunteer automatic stage 2 deworming passed');

console.log('\nAll volunteer mechanics & formula cutoff assertions executed!');
