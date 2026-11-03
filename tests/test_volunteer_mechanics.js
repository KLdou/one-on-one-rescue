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
    const isModalOrOverlay = id.toLowerCase().includes('modal') || id.toLowerCase().includes('overlay');
    const classSet = new Set(isModalOrOverlay ? ['hidden'] : []);
    let innerHTML = '';
    const elem = {
      id,
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        contains: (c) => classSet.has(c)
      },
      style: {},
      textContent: '',
      appendChild: function(child) { this.children.push(child); },
      children: []
    };
    Object.defineProperty(elem, 'innerHTML', {
      get: () => innerHTML,
      set: function(val) {
        innerHTML = val;
        if (val === '') this.children = [];
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

// Test 6: Call interception edge case — button locked and transfer rejected
context.startNewRun(false);
const callMock = {
  id: 'call_compromise_normal_family',
  candidateName: 'Семья из Минска',
  isSafe: true,
  isCompromise: true
};
context.window.currentCandidateCall = callMock;
context.renderCandidateActionButtons(callMock);
const actionBtns = context.document.getElementById('candidateActionButtons');
assert(actionBtns.children.length > 0, 'Action buttons should be rendered');

// Simulate call marked intercepted
context.markCandidateCallIntercepted(callMock.id);
assert.strictEqual(callMock.intercepted, true, 'Call should be marked intercepted');
assert.strictEqual(actionBtns.children.length, 1, 'Only blocked button should remain');
assert(actionBtns.children[0].textContent.includes('перехвачена'), 'Button must state that call was intercepted');

// Accepting intercepted call must reject transfer
const countBefore = context.state.animal.count;
context.actionAcceptCandidate(false, {});
assert.strictEqual(context.state.animal.count, countBefore, 'Transfer must be rejected for intercepted call');
console.log('✓ Test 6: Volunteer interception button lock and transfer rejection passed');

// Test 7: Timer Guard and isModalActive check
context.startNewRun(false);
context.closeAnimalModal();
context.closeEventModal();
context.state.onboarding.acutePhase = false;
context.setSpeed(1);
assert.strictEqual(context.currentSpeed, 1, 'Speed should be 1');

// Open candidate interview modal: must stop timer and block speed
context.document.getElementById('candidateInterviewModal').classList.remove('hidden');
assert.strictEqual(context.isModalActive(), true, 'isModalActive must be true when modal is visible');
context.stopTimer();
context.setSpeed(2);
assert.strictEqual(context.currentSpeed, 0, 'setSpeed must be blocked while modal is active');

context.document.getElementById('candidateInterviewModal').classList.add('hidden');
assert.strictEqual(context.isModalActive(), false, 'isModalActive must be false when modal is hidden');
context.setSpeed(2);
assert.strictEqual(context.currentSpeed, 2, 'Speed can be set after modal is closed');
context.stopTimer();
console.log('✓ Test 7: Timer Guard and isModalActive checks passed');

console.log('\nAll volunteer mechanics & formula cutoff assertions executed!');
