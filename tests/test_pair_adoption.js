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
  Math: Math,
  Date: Date,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {}
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

console.log('Environment loaded successfully.');

// TEST SUITE
vm.runInContext(`
  // -------------------------------------------------------------
  // Test 1: Pair adoption generates two distinct nicknames
  // -------------------------------------------------------------
  const scen = window.GAME_DATA.scenarios.find(s => s.id === 'healthy_popular_kittens');
  startNewRun(false, scen);
  state.animal.activeCount = 4;
  state.animal.count = 4;
  state.animal.totalCount = 4;
  state.animal.species = 'cat';
  state.animal.petName = null;

  const callData = {
    id: 'call_ideal_pet_screen_family',
    caller: 'Семья с сетками Антикошка',
    candidateName: 'Анна и Максим',
    housing: 'Своя квартира (Минск)',
    source: 'Куфар',
    isSafe: true,
    canTakePair: true
  };

  finishTransferToTrial(2, callData, { successChance: 0.95 }, false);

  assert.strictEqual(state.trialAnimals.length, 1, 'Should have 1 trial animal entry for the pair');
  const trial = state.trialAnimals[0];
  assert.strictEqual(trial.count, 2, 'Trial item should have count 2');
  assert.ok(trial.petNames && trial.petNames.length === 2, 'Trial item should have 2 distinct petNames');
  assert.notStrictEqual(trial.petNames[0], trial.petNames[1], 'Both kittens must have different names');
  assert.ok(trial.petName.includes(trial.petNames[0]) && trial.petName.includes(trial.petNames[1]), 'trial.petName should include both names');
  
  // Verify log contains both names
  const nameLog = state.logs.find(l => l.text.includes('🏷️') && l.text.includes(trial.petNames[0]) && l.text.includes(trial.petNames[1]));
  assert.ok(nameLog, 'Naming log must mention both names');
  console.log('✓ Test 1 Passed: Pair nicknames correctly assigned.');

  // -------------------------------------------------------------
  // Test 2: Checking trial status greets for BOTH kittens (plural)
  // -------------------------------------------------------------
  state.logs = [];
  actionCheckTrialPetStatus();
  const checkLog = state.logs.find(l => l.text.includes('📱'));
  assert.ok(checkLog, 'Should have check status log');
  assert.ok(checkLog.text.includes(trial.petNames[0]) && checkLog.text.includes(trial.petNames[1]), 'Check status log must mention both names');
  assert.ok(checkLog.text.includes('малыши') || checkLog.text.includes('хвостики') || checkLog.text.includes('обоих'), 'Greeting from home should be plural for a pair');
  console.log('✓ Test 2 Passed: Status check greetings handle pair correctly.');

  // -------------------------------------------------------------
  // Test 3: Trial completion adds BOTH kittens to Album as separate tails
  // -------------------------------------------------------------
  // Advance days to day 14 and trigger trial completion
  trial.daysPassed = 13;
  // Force Math.random to pass trial success
  const origRandom = Math.random;
  Math.random = () => 0.01;
  const initialSavedCount = state.animal.savedCount;
  
  // Tick forward one day to trigger trial completion
  processDayTick();
  Math.random = origRandom;

  assert.strictEqual(state.animal.savedCount, initialSavedCount + 2, 'Saved count must increase by 2');
  assert.strictEqual(state.savedTails.length, 2, 'state.savedTails must contain 2 separate records for the pair');
  assert.strictEqual(state.savedTails[0].petName, trial.petNames[0], 'First saved tail should have name 1');
  assert.strictEqual(state.savedTails[1].petName, trial.petNames[1], 'Second saved tail should have name 2');

  const album = getSavedAlbum();
  assert.strictEqual(album.length, 2, 'Album must store both kittens');
  console.log('✓ Test 3 Passed: Trial completion saves both kittens to Album.');

  // -------------------------------------------------------------
  // Test 4: Greetings from home can be received for BOTH kittens in Album
  // -------------------------------------------------------------
  state.logs = [];
  const tail1 = album[0];
  const tail2 = album[1];
  actionReceiveGreetingFromHome(tail1.id);
  const logTail1 = state.logs.find(l => l.text.includes('💌') && l.text.includes(tail1.petName));
  assert.ok(logTail1, 'Greeting received from tail 1');

  state.logs = [];
  actionReceiveGreetingFromHome(tail2.id);
  const logTail2 = state.logs.find(l => l.text.includes('💌') && l.text.includes(tail2.petName));
  assert.ok(logTail2, 'Greeting received from tail 2');
  console.log('✓ Test 4 Passed: Album greetings work for each kitten.');

  // -------------------------------------------------------------
  // Test 5: completeOneOrPairAdoption with pair assigns 2 nicknames
  // -------------------------------------------------------------
  state.animal.activeCount = 2;
  state.animal.count = 2;
  state.animal.totalCount = 4;
  state.savedTails = [];
  completeOneOrPairAdoption(true, 'Успех!');
  assert.strictEqual(state.savedTails.length, 2, 'Should save 2 tails for direct pair adoption');
  assert.notStrictEqual(state.savedTails[0].petName, state.savedTails[1].petName, 'Both kittens have distinct names in direct adoption');
  console.log('✓ Test 5 Passed: Direct pair adoption creates two distinct named tails.');
`, context);

console.log('All tests finished!');
