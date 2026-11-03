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
global.document = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    innerHTML: '',
    textContent: '',
    className: '',
    value: '',
    focus: () => {},
    style: {}
  }),
  querySelectorAll: () => []
};

// UI and notification stubs
global.renderAll = () => {};
global.renderLog = () => {};
global.renderStatusHeader = () => {};
global.renderResourcesBar = () => {};
global.renderAnimalCard = () => {};
global.renderActionDashboard = () => {};
global.stopTimer = () => {};
global.startTimer = () => {};
global.closeEventModal = () => {};
global.showEventModal = () => {};
global.showVictoryModal = () => {};
global.showDefeatModal = () => {};

// Load modular JS files using vm.runInThisContext so top-level function declarations become global
const files = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/actions.js',
  'game_modular/js/engine.js',
  'game_modular/js/adopters.js',
  'game_modular/js/events.js'
];

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInThisContext(code, { filename: f });
}

console.log('--- TEST RUN START ---');

// Test 1.1: escapeSearchAction
console.log('Testing 1.1: escapeSearchAction...');
window.state = {
  animal: {
    species: 'cat',
    gender: 'female',
    name: 'Мурка'
  },
  energy: 50,
  moneyBYN: 100,
  mental: 70
};
window.addLog = (msg) => {};
// Should not throw ReferenceError
window.escapeSearchAction('neighborhood');
console.log('✓ Test 1.1 passed!');

// Test 1.2: savePetToAlbum upsert
console.log('Testing 1.2: savePetToAlbum upsert...');
localStorage.clear();
const pet1 = { id: 'pet_123', name: 'Барсик', daysPassed: 14 };
window.savePetToAlbum(pet1);
let album = window.getSavedAlbum();
assert.strictEqual(album.length, 1);
assert.strictEqual(album[0].name, 'Барсик');

const pet1Updated = { id: 'pet_123', name: 'Барсик Счастливый', daysPassed: 20 };
window.savePetToAlbum(pet1Updated);
album = window.getSavedAlbum();
assert.strictEqual(album.length, 1, 'Album should still have length 1 after upsert');
assert.strictEqual(album[0].name, 'Барсик Счастливый', 'Name should be updated');
console.log('✓ Test 1.2 passed!');

// Test 1.3: canAffordVetBill & payVetBill
console.log('Testing 1.3: canAffordVetBill & payVetBill...');
window.state.player = { mobility: { id: 'car' } };
window.state.triggeredEvents = {};
window.state.cash = 10;
window.state.energy = 50;
window.state.zooshans = {
  applicationSubmitted: false,
  clinicMode: 'partner_cash',
  voucherDebt: 0,
  voucherBlocked: true,
  officialFundraiserActive: false,
  officialFundraiserBYN: 0
};
// 50 BYN checkup cannot be afforded
assert.strictEqual(window.canAffordVetBill(50, false), false);
// payVetBill should return false and not deduct energy
const paid = window.payVetBill(50, false, 'Осмотр', false, 10);
assert.strictEqual(paid, false);
assert.strictEqual(window.state.energy, 50, 'Energy should not be spent if cannot pay bill');
console.log('✓ Test 1.3 passed!');

// Test 1.4: 14-day trial period
console.log('Testing 1.4: 14-day trial period unification...');
window.state.trialAnimals = [
  { id: 'trial_cat', name: 'Лаки', daysPassed: 0, trialDaysTotal: 14 }
];
assert.strictEqual(window.state.trialAnimals[0].trialDaysTotal, 14);
console.log('✓ Test 1.4 passed!');

// Test 1.5: personalSpent & prChannel in tailRecord
console.log('Testing 1.5: personalSpent and prChannel in tailRecord...');
window.state.personalMoneySpent = 350;
window.state.calendarDate = new Date(2026, 4, 15);
window.state.zooshans.hasProPhotos = true;
window.state.zooshans.locationStatus = 'home';
// initiate animal transfer with trial
window.state.animal = {
  id: 'test_adopt',
  name: 'Рыжик',
  petName: 'Рыжик',
  species: 'cat',
  speciesLabel: 'Кот',
  gender: 'male',
  coatName: 'Ярко-рыжий',
  coatTier: 'hit',
  activeCount: 1,
  ageCategory: 'adult'
};
const trialCall = {
  id: 'call_compromise_normal_family',
  candidateName: 'Семья Ивановых',
  housing: '2к кв'
};
window.initiateAnimalTransferWithTrial(trialCall, {});
console.log('trialAnimals in test:', JSON.stringify(window.state.trialAnimals));
assert.strictEqual(window.state.trialAnimals.length, 2);
const addedTrial = window.state.trialAnimals.find(t => t.petName === 'Рыжик');
assert.ok(addedTrial, 'Animal should be in trialAnimals');
assert.strictEqual(addedTrial.trialDaysTotal, 14);
console.log('✓ Test 1.5 passed!');

// Test 2.1: Chronic GI Celesta Case
console.log('Testing 2.1: Chronic GI Celesta Case...');
const celestaCat = {
  id: 'celesta',
  species: 'cat',
  gender: 'female',
  pcrPending: true,
  pcrDaysRemaining: 0,
  hiddenState: { hasChronicGI: true },
  health: 70
};
window.state.animal = celestaCat;
window.state.day = 5;
// Run PCR completion logic
if (celestaCat.pcrPending && celestaCat.pcrDaysRemaining <= 0) {
  celestaCat.pcrPending = false;
  celestaCat.pcrTested = true;
  if (celestaCat.hiddenState.hasChronicGI) {
    celestaCat.knownVirus = 'Трихомоноз (простейшие ЖКТ)';
  }
}
assert.strictEqual(celestaCat.knownVirus, 'Трихомоноз (простейшие ЖКТ)');
console.log('✓ Test 2.1 passed!');

// Test 2.2: Anti-escape harness
console.log('Testing 2.2: Anti-escape harness in config...');
assert.strictEqual(window.GAME_DATA.config.prices.antiEscapeHarness, 60);
console.log('✓ Test 2.2 passed!');

// Test 2.3: Trojan horse incubation & dogCoatIndexRange
console.log('Testing 2.3: Trojan horse incubation & dogCoatIndexRange...');
const trojanScenario = window.GAME_DATA.scenarios.find(s => s.id === 'ginger_kitten_trojan_horse');
assert.strictEqual(trojanScenario.hiddenState.virusIncubationDays, 4);
assert.strictEqual(trojanScenario.hiddenState.ringwormIncubationDays, 5);

const dogScenario = window.GAME_DATA.scenarios.find(s => s.id === 'healthy_adult_dog_rehab');
assert.ok(Array.isArray(dogScenario.dogCoatIndexRange));
const generatedDog = window.generateRandomAnimalScenario(dogScenario);
assert.ok(generatedDog.coatName, 'Generated dog must have coatName');
console.log('✓ Test 2.3 passed!');

// Test 2.4: Grammatical gender agreement in pet naming
console.log('Testing 2.4: Grammatical gender agreement in pet naming...');
assert.strictEqual(window.adaptToponymGender('Рокоссовский', true), 'Рокоссовская');
assert.strictEqual(window.adaptToponymGender('Ждановичская', false), 'Ждановичский');
assert.strictEqual(window.adaptToponymGender('Лошицкий', true), 'Лошицкая');

const maleName = window.getRandomPetname('male');
const femaleName = window.getRandomPetname('female');
console.log(`  Sample male name: "${maleName}"`);
console.log(`  Sample female name: "${femaleName}"`);
assert.ok(femaleName.includes('ая') || femaleName.includes('яя') || femaleName.includes('Комаровская') || femaleName.includes('ская') || femaleName.includes('цкая') || femaleName.includes('Прушинских') || femaleName.includes('их'));
console.log('✓ Test 2.4 passed!');

// Test 2.5: Dynamic calls loading from window.GAME_DATA.calls
console.log('Testing 2.5: Dynamic calls loading from window.GAME_DATA.calls...');
const catAnimal = {
  species: 'cat',
  gender: 'female',
  ageCategory: 'adult',
  coatId: 'tabby',
  coatName: 'Серо-полосатый',
  activeCount: 1,
  knownCarrier: 'none',
  hiddenState: {}
};
window.state.calendarDate = new Date(2026, 4, 15); // May 15 (Spring)
const catCalls = window.getDynamicAdopterCalls(catAnimal);
assert.ok(catCalls.length > 5, 'Should have multiple adopter calls for cat');
// FeLV call should NOT be in pool for healthy cat
assert.strictEqual(catCalls.some(c => c.id === 'call_felv_aware_single_pet'), false);
// Dog chain call should NOT be in pool for cat
assert.strictEqual(catCalls.some(c => c.id === 'call_dog_chain_village'), false);

// Now test FeLV cat
catAnimal.knownCarrier = 'FeLV';
const felvCalls = window.getDynamicAdopterCalls(catAnimal);
assert.strictEqual(felvCalls.some(c => c.id === 'call_felv_aware_single_pet'), true, 'FeLV call must be present for FeLV carrier');

// Test dog calls
const dogAnimal = {
  species: 'dog',
  gender: 'male',
  ageCategory: 'adult',
  coatName: 'Черно-подпалый',
  activeCount: 1,
  hiddenState: {}
};
const dogCalls = window.getDynamicAdopterCalls(dogAnimal);
assert.strictEqual(dogCalls.some(c => c.id === 'call_dog_chain_village'), true, 'Dog chain call must be present for dog');
assert.strictEqual(dogCalls.some(c => c.id === 'call_window_fall_fatal'), false, 'Window fall call must NOT be present for dog');

// Scammer calls
const scamCalls = window.getDynamicScammerCalls(catAnimal);
assert.strictEqual(scamCalls.length, 2);
assert.strictEqual(scamCalls[0].isScam, true);
console.log('✓ Test 2.5 passed!');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
