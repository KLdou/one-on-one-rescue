const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Mock browser environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _store: () => store
  };
})();

global.window = global;
global.localStorage = localStorageMock;

const elements = {};
function getOrCreateMockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      classList: {
        classes: new Set(['hidden']),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        contains: function(c) { return this.classes.has(c); }
      },
      appendChild: () => {},
      innerHTML: '',
      textContent: '',
      className: '',
      value: '',
      focus: () => {},
      style: {}
    };
  }
  return elements[id];
}

global.document = {
  body: { setAttribute: () => {} },
  getElementById: (id) => getOrCreateMockElement(id),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    innerHTML: '',
    textContent: '',
    className: '',
    setAttribute: () => {},
    addEventListener: () => {}
  })
};

let timerStopped = false;
global.stopTimer = () => { timerStopped = true; };
global.startTimer = () => { timerStopped = false; };
global.renderAll = () => {};
global.addLog = () => {};

// Load modules
const files = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/engine.js',
  'game_modular/js/events.js',
  'game_modular/js/actions.js',
  'game_modular/js/adopters.js',
  'game_modular/js/ui.js'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  vm.runInThisContext(content, { filename: file });
}

console.log('Testing Scenario Picker logic...');

// Test 1: openScenarioPickerModal stops timer and shows modal
assert(typeof openScenarioPickerModal === 'function', 'openScenarioPickerModal must be a defined function');
currentSpeed = 2;
openScenarioPickerModal();
assert.strictEqual(currentSpeed, 0, 'openScenarioPickerModal must call stopTimer() setting currentSpeed = 0');
const modalEl = document.getElementById('scenarioPickerModal');
assert(!modalEl.classList.contains('hidden'), 'scenarioPickerModal must not have hidden class');

// Test 2: closeScenarioPickerModal hides modal
assert(typeof closeScenarioPickerModal === 'function', 'closeScenarioPickerModal must be a defined function');
closeScenarioPickerModal();
assert(modalEl.classList.contains('hidden'), 'scenarioPickerModal must have hidden class');

// Test 3: selectScenarioAndStart correctly sets every single scenario
assert(typeof selectScenarioAndStart === 'function', 'selectScenarioAndStart must be a defined function');

const scenarios = window.GAME_DATA.scenarios;
assert(scenarios.length >= 19, 'There should be at least 19 scenarios');

for (const sc of scenarios) {
  selectScenarioAndStart(sc.id);
  assert.strictEqual(state.animal.id, sc.id, `Scenario ID mismatch for ${sc.id}`);
  assert(state.animal.coat, `Animal coat must be generated for ${sc.id}`);
  assert(state.animal.coatName, `Animal coatName must be generated for ${sc.id}`);
  assert(!state.animal.title.includes('{coatName}'), `Title template placeholder {coatName} must be replaced in ${sc.id}`);
  assert(!state.animal.title.includes('{cnt}'), `Title template placeholder {cnt} must be replaced in ${sc.id}`);
  assert(!state.animal.visualDescription.includes('{coatName}'), `Description template placeholder {coatName} must be replaced in ${sc.id}`);
}

console.log('All Scenario Picker tests passed successfully!');
