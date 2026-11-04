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

console.log('Environment loaded successfully for Dog Adopter Sync Tests.');

// Hook showEventModal to capture modal data
vm.runInContext(`
  const origShowEventModal = window.showEventModal;
  window.lastModalData = null;
  window.showEventModal = function(title, desc, buttons) {
    window.lastModalData = { title, desc, buttons };
    if (typeof origShowEventModal === 'function') {
      try { origShowEventModal(title, desc, buttons); } catch (e) {}
    }
  };
`, context);

// Test 1: Adopter call for dog (species: 'dog')
// call_ideal_pet_screen_family does NOT contain "Антикошка" or "Pet Screen" or "котят",
// and DOES contain "поводке", "шлейке", "адресник".
vm.runInContext(`{
  const dogAnimal = {
    species: 'dog',
    name: 'Бобик',
    gender: 'male',
    ageCategory: 'adult',
    activeCount: 1,
    totalCount: 1
  };
  const dogCalls = getDynamicAdopterCalls(dogAnimal);
  const dogIdeal = dogCalls.find(c => c.id === 'call_ideal_pet_screen_family');
  assert(dogIdeal, 'Dog should have call_ideal_pet_screen_family available in pool');

  assert(!dogIdeal.dialogue.includes('Антикошка'), 'Dog dialogue must not mention Антикошка');
  assert(!dogIdeal.dialogue.includes('Pet Screen'), 'Dog dialogue must not mention Pet Screen');
  assert(!dogIdeal.dialogue.includes('котят'), 'Dog dialogue must not mention котят');
  assert(!dogIdeal.extraQuestionReply.includes('котят'), 'Dog extraQuestionReply must not mention котят');

  assert(dogIdeal.dialogue.includes('поводке'), 'Dog dialogue must mention поводке');
  assert(dogIdeal.dialogue.includes('шлейке'), 'Dog dialogue must mention шлейке');
  assert(dogIdeal.dialogue.includes('адресник'), 'Dog dialogue must mention адресник');
  console.log('PASS: Test 1 - Dog call_ideal_pet_screen_family dialogue and extraQuestionReply adapted for dogs.');
}`, context);

// Test 2: ensureCandidateCallSlots for dog with call_ideal_pet_screen_family
// slot1.title is "Безопасность и выгул" and text refers to leash/harness/address tag
vm.runInContext(`{
  const dogAnimal = {
    species: 'dog',
    name: 'Бобик',
    gender: 'male',
    ageCategory: 'adult',
    activeCount: 1,
    totalCount: 1
  };
  const dogCall = {
    id: 'call_ideal_pet_screen_family',
    caller: 'Осознанная молодая семья программистов',
    isSafe: true
  };
  ensureCandidateCallSlots(dogCall, dogAnimal);

  assert.strictEqual(dogCall.slot1.title, 'Безопасность и выгул', 'Dog slot1 title must be Безопасность и выгул');
  assert(dogCall.slot1.text.includes('поводке') || dogCall.slot1.text.includes('шлейке') || dogCall.slot1.text.includes('адресник'),
    'Dog slot1 text must refer to leash/harness/address tag');
  assert(!dogCall.slot1.text.includes('Антикошка'), 'Dog slot1 text must not mention Антикошка');
  assert.strictEqual(dogCall.housing, 'Своя кв. рядом с парком (Новая Боровая)', 'Dog housing must refer to park');
  console.log('PASS: Test 2 - ensureCandidateCallSlots creates dog-appropriate slot1 and housing.');
}`, context);

// Test 3: Adopter call for cat (species: 'cat')
// call_ideal_pet_screen_family still mentions "Антикошка" (Pet Screen)
vm.runInContext(`{
  const catAnimal = {
    species: 'cat',
    name: 'Мурка',
    gender: 'female',
    ageCategory: 'adult',
    activeCount: 1,
    totalCount: 1
  };
  const catCalls = getDynamicAdopterCalls(catAnimal);
  const catIdeal = catCalls.find(c => c.id === 'call_ideal_pet_screen_family');
  assert(catIdeal, 'Cat should have call_ideal_pet_screen_family available in pool');

  assert(catIdeal.dialogue.includes('Антикошка'), 'Cat dialogue must mention Антикошка');
  assert(catIdeal.dialogue.includes('Pet Screen'), 'Cat dialogue must mention Pet Screen');

  const catCall = {
    id: 'call_ideal_pet_screen_family',
    caller: 'Осознанная молодая семья программистов',
    isSafe: true
  };
  ensureCandidateCallSlots(catCall, catAnimal);
  assert.strictEqual(catCall.slot1.title, 'Безопасность и окна', 'Cat slot1 title must be Безопасность и окна');
  assert(catCall.slot1.text.includes('Антикошка'), 'Cat slot1 text must mention Антикошка');
  console.log('PASS: Test 3 - Cat call_ideal_pet_screen_family dialogue and slot1 remain cat-specific.');
}`, context);

// Test 4: triggerTrialSuccessModal for dog (species: 'dog')
// text does NOT contain "мурчит", and mentions "гуляет" and "виляет хвостом"
vm.runInContext(`{
  const dogTrial = {
    id: 12345,
    petName: 'Шарик',
    species: 'dog',
    count: 1,
    adopterSummary: 'Дмитрий и Алина'
  };
  triggerTrialSuccessModal(dogTrial);
  assert(window.lastModalData, 'Modal must have been triggered');
  const dogDesc = window.lastModalData.desc;
  assert(!dogDesc.includes('мурчит'), 'Dog trial success text must NOT contain "мурчит"');
  assert(dogDesc.includes('гуляет'), 'Dog trial success text must mention "гуляет"');
  assert(dogDesc.includes('виляет хвостом'), 'Dog trial success text must mention "виляет хвостом"');

  // Also test pair of dogs
  const dogPairTrial = {
    id: 12346,
    petName: 'Бим и Бом',
    species: 'dog',
    count: 2,
    adopterSummary: 'Дмитрий и Алина'
  };
  triggerTrialSuccessModal(dogPairTrial);
  const pairDesc = window.lastModalData.desc;
  assert(!pairDesc.includes('мурчат'), 'Dog pair trial success text must NOT contain "мурчат"');
  assert(pairDesc.includes('гуля') || pairDesc.includes('бегают'), 'Dog pair trial success text must mention walking/running');
  assert(pairDesc.includes('виляют'), 'Dog pair trial success text must mention "виляют"');
  console.log('PASS: Test 4 - triggerTrialSuccessModal adapts message for dogs (single and pair).');
}`, context);

// Test 5: triggerTrialSuccessModal for cat (species: 'cat')
// still contains "мурчит на руках"
vm.runInContext(`{
  const catTrial = {
    id: 54321,
    petName: 'Барсик',
    species: 'cat',
    count: 1,
    adopterSummary: 'Анна'
  };
  triggerTrialSuccessModal(catTrial);
  assert(window.lastModalData, 'Modal must have been triggered');
  const catDesc = window.lastModalData.desc;
  assert(catDesc.includes('мурчит на руках'), 'Cat trial success text must contain "мурчит на руках"');

  const catPairTrial = {
    id: 54322,
    petName: 'Пушок и Снежок',
    species: 'cat',
    count: 2,
    adopterSummary: 'Анна'
  };
  triggerTrialSuccessModal(catPairTrial);
  const catPairDesc = window.lastModalData.desc;
  assert(catPairDesc.includes('мурчат на руках'), 'Cat pair trial success text must contain "мурчат на руках"');
  console.log('PASS: Test 5 - triggerTrialSuccessModal retains purring text for cats.');
}`, context);

// Test 6: calls.json and GAME_DATA.calls in data_loader.js are in 100% sync
const callsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'game_modular', 'data', 'calls.json'), 'utf8'));
const dataLoaderContent = fs.readFileSync(path.join(__dirname, '..', 'game_modular', 'js', 'data_loader.js'), 'utf8');
const match = dataLoaderContent.match(/^window\.GAME_DATA = (\{.*\});/m);
assert(match, 'window.GAME_DATA must be defined on line 2 in data_loader.js');
const gameData = JSON.parse(match[1]);
assert.deepStrictEqual(callsJson, gameData.calls, 'calls.json and GAME_DATA.calls must be in 100% sync');
console.log('PASS: Test 6 - calls.json and GAME_DATA.calls are in 100% sync.');

console.log('\nAll Dog Adopter Sync tests passed successfully!');
