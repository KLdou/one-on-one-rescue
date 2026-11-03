const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

// Test 1: JSON file exists and contains all 8 required hint IDs
const rawJson = fs.readFileSync(path.resolve(__dirname, '../game_modular/data/mentor_hints.json'), 'utf8');
const hints = JSON.parse(rawJson);
const requiredKeys = [
  'LOW_ENERGY_WARNING',
  'CLINIC_DEBT_HALFWAY',
  'QUARANTINE_BREACH_RISK',
  'REVACCINATION_OVERDUE',
  'STALE_PR_WARNING',
  'FIRST_TRIAL_STARTED',
  'ADOPTION_FAILED_POSTMORTEM',
  'SCAM_VICTIM_POSTMORTEM'
];

requiredKeys.forEach(k => {
  assert(hints[k], `Missing hint key: ${k}`);
  assert(hints[k].id === k, `Mismatch id for ${k}`);
  assert(['advice', 'post_mortem'].includes(hints[k].type), `Invalid type for ${k}`);
  assert(hints[k].title, `Missing title for ${k}`);
  assert(hints[k].message, `Missing message for ${k}`);
  assert(hints[k].rule, `Missing rule for ${k}`);
});
console.log('✓ Task 1: mentor_hints.json structure valid');

// Test 1b: Verify fallback in data_loader.js
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

const gameFiles = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/events.js',
  'game_modular/js/engine.js',
  'game_modular/js/actions.js',
  'game_modular/js/adopters.js',
  'game_modular/js/ui.js'
];

gameFiles.forEach(file => {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  vm.runInContext(code, context);
});

assert(context.window.GAME_DATA, 'window.GAME_DATA must exist');
assert(context.window.GAME_DATA.mentorHints, 'mentorHints missing from window.GAME_DATA fallback');
requiredKeys.forEach(k => {
  assert(context.window.GAME_DATA.mentorHints[k], `Missing fallback mentorHint in data_loader.js: ${k}`);
});
console.log('✓ Task 1: data_loader.js fallback window.GAME_DATA.mentorHints valid');

// Test 2: Meta-progress and localStorage persistence in state.js
// Ensure cross-realm array compatibility for Node 22 assert.deepStrictEqual
const _origGetUnlocked = context.getUnlockedMentorHints;
context.getUnlockedMentorHints = () => Array.from(_origGetUnlocked());

context.startNewRun(false);
assert.strictEqual(context.state.animal.daysSinceVaccine1, 0, 'daysSinceVaccine1 must be initialized to 0');
assert.strictEqual(context.state.animal.vaccineDewormLapse, false, 'vaccineDewormLapse must be initialized to false');
assert.deepStrictEqual(context.getUnlockedMentorHints(), [], 'Initial hints should be empty');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false);

const isNew = context.unlockMentorHint('LOW_ENERGY_WARNING');
assert.strictEqual(isNew, true, 'First unlock should return true');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true);
assert.strictEqual(context.unlockMentorHint('LOW_ENERGY_WARNING'), false, 'Duplicate unlock returns false');

// Restart run and verify hints are preserved
context.startNewRun(false);
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true, 'Hints must persist across runs');

// Reset progress
context.resetMentorProgress();
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false, 'Hints should be cleared after reset');
console.log('✓ Task 2: Meta-progress and localStorage persistence verified');
