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
    const classSet = new Set();
    let innerHTML = '';
    const elem = {
      id,
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        toggle: (c) => { if (classSet.has(c)) classSet.delete(c); else classSet.add(c); },
        contains: (c) => classSet.has(c)
      },
      style: {},
      textContent: '',
      children: [],
      appendChild: function(child) { this.children.push(child); },
      addEventListener: () => {}
    };
    Object.defineProperty(elem, 'innerHTML', {
      get: () => innerHTML,
      set: function(val) {
        innerHTML = val;
        this.textContent = val.replace(/<[^>]*>/g, '');
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
    style: {},
    children: [],
    appendChild: () => {}
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

// Load game files in order
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

console.log('--- Running Resource Tooltips TDD Test Suite ---');

// Initialize a game run
context.startNewRun(false);

// Test 1: getResourceTooltipData function must exist
assert.strictEqual(typeof context.getResourceTooltipData, 'function', 'getResourceTooltipData must be a defined function');

// Test 2: Calculate Cash tooltip data accurately
context.state.cash = 350;
context.state.day = 12;
context.state.player.income.monthlyFreeCash = 400;
context.state.fundraising = { personalCardRaisedYear: 1200 };

const dataD12 = context.getResourceTooltipData(context.state);
assert(dataD12.cash, 'Cash tooltip data missing');
assert.strictEqual(dataD12.cash.current, 350, 'Current cash should be 350');
assert.strictEqual(dataD12.cash.monthlySalary, 400, 'Monthly salary should be 400');
assert.strictEqual(dataD12.cash.daysUntilSalary, 18, 'Days until salary on day 12 should be 18');
assert.strictEqual(dataD12.cash.isSalaryToday, false, 'Salary should not be today on day 12');

// Day 30: salary is today!
context.state.day = 30;
const dataD30 = context.getResourceTooltipData(context.state);
assert.strictEqual(dataD30.cash.daysUntilSalary, 0, 'Days until salary on day 30 should be 0');
assert.strictEqual(dataD30.cash.isSalaryToday, true, 'Salary should be today on day 30');

// Day 31: salary is in 29 days
context.state.day = 31;
const dataD31 = context.getResourceTooltipData(context.state);
assert.strictEqual(dataD31.cash.daysUntilSalary, 29, 'Days until salary on day 31 should be 29');

// Test 3: Calculate Mental tooltip data accurately
// Case A: Partner (+3), own home (0), litter trained (0) -> net = +3
context.state.player.family.mentalBonus = 3;
context.state.player.housing.dailyMentalDrain = 0;
context.state.zooshans.locationStatus = 'home_floor';
context.state.animal.litterTrained = true;
const dataMentalA = context.getResourceTooltipData(context.state);
assert.strictEqual(dataMentalA.mental.familyBonus, 3);
assert.strictEqual(dataMentalA.mental.housingDrain, 0);
assert.strictEqual(dataMentalA.mental.litterDrain, 0);
assert.strictEqual(dataMentalA.mental.netDailyChange, 3);

// Case B: Single (0), relatives (-2), not litter trained (-3) -> net = -5
context.state.player.family.mentalBonus = 0;
context.state.player.housing.dailyMentalDrain = 2;
context.state.animal.litterTrained = false;
const dataMentalB = context.getResourceTooltipData(context.state);
assert.strictEqual(dataMentalB.mental.housingDrain, 2);
assert.strictEqual(dataMentalB.mental.litterDrain, 3);
assert.strictEqual(dataMentalB.mental.netDailyChange, -5);

// Case C: Animal on paid foster -> home housing drain = 0, litter drain = 0
context.state.zooshans.locationStatus = 'paid_foster';
const dataMentalC = context.getResourceTooltipData(context.state);
assert.strictEqual(dataMentalC.mental.housingDrain, 0, 'Housing drain should be 0 when animal is on paid foster');
assert.strictEqual(dataMentalC.mental.litterDrain, 0, 'Litter drain should be 0 when animal is on paid foster');
assert.strictEqual(dataMentalC.mental.netDailyChange, 0);

// Test 4: Calculate Energy tooltip data accurately
context.state.zooshans.locationStatus = 'home_floor';
context.state.player.family.energyBonus = 36;
const householdDrain = context.calculateDailyHouseholdEnergyDrain();
const dataEnergy = context.getResourceTooltipData(context.state);
assert.strictEqual(dataEnergy.energy.morningBonus, 36);
assert.strictEqual(dataEnergy.energy.householdDrain, householdDrain);
assert.strictEqual(dataEnergy.energy.netMorningChange, 36 - householdDrain);

// When animal in stationary: household drain = 0
context.state.animal.inStationaryDaysLeft = 3;
const dataEnergyStationary = context.getResourceTooltipData(context.state);
assert.strictEqual(dataEnergyStationary.energy.householdDrain, 0);
assert.strictEqual(dataEnergyStationary.energy.netMorningChange, 36);
context.state.animal.inStationaryDaysLeft = 0;

// Test 5: Verify updateResourceTooltips renders content without errors or NaN/undefined
assert.strictEqual(typeof context.updateResourceTooltips, 'function', 'updateResourceTooltips must be a defined function');
context.updateResourceTooltips();

// Check generated HTML
const tooltipCash = getOrCreateElem('tooltip-cash');
const tooltipMental = getOrCreateElem('tooltip-mental');
const tooltipEnergy = getOrCreateElem('energy-tooltip');
const tooltipHealth = getOrCreateElem('tooltip-health');

assert(tooltipCash.innerHTML.length > 50, 'tooltip-cash should contain rendered content');
assert(tooltipMental.innerHTML.length > 50, 'tooltip-mental should contain rendered content');
assert(tooltipEnergy.innerHTML.length > 50, 'energy-tooltip should contain rendered content');
assert(tooltipHealth.innerHTML.length > 50, 'tooltip-health should contain rendered content');

assert(!tooltipCash.innerHTML.includes('undefined'), 'tooltip-cash must not contain undefined');
assert(!tooltipCash.innerHTML.includes('NaN'), 'tooltip-cash must not contain NaN');
assert(!tooltipMental.innerHTML.includes('undefined'), 'tooltip-mental must not contain undefined');
assert(!tooltipMental.innerHTML.includes('NaN'), 'tooltip-mental must not contain NaN');
assert(!tooltipEnergy.innerHTML.includes('undefined'), 'energy-tooltip must not contain undefined');
assert(!tooltipEnergy.innerHTML.includes('NaN'), 'energy-tooltip must not contain NaN');
assert(!tooltipHealth.innerHTML.includes('undefined'), 'tooltip-health must not contain undefined');
assert(!tooltipHealth.innerHTML.includes('NaN'), 'tooltip-health must not contain NaN');

// Currency invariant
assert(!tooltipCash.innerHTML.includes('$'), 'tooltip-cash must not contain $');
assert(!tooltipMental.innerHTML.includes('$'), 'tooltip-mental must not contain $');
assert(!tooltipEnergy.innerHTML.includes('$'), 'energy-tooltip must not contain $');
assert(!tooltipHealth.innerHTML.includes('$'), 'tooltip-health must not contain $');

console.log('✅ ALL RESOURCE TOOLTIPS TDD TESTS PASSED!');
