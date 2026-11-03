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
    id, style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {}, innerHTML: '', textContent: '', value: '',
    setAttribute: () => {}, removeAttribute: () => {}, addEventListener: () => {}, appendChild: () => {}, removeChild: () => {}, focus: () => {}, children: []
  });

  const ids = [
    'cashValue', 'mentalBar', 'mentalValue', 'energyBar', 'energyValue', 'healthBar', 'healthValue',
    'foodStockDays', 'feedReserveDays', 'calendarDay', 'activeCuratorName', 'activePetTitle', 'activePetBreed',
    'activePetCoat', 'activePetArchetype', 'activePetAge', 'activePetStory', 'zooshansDebtLimit', 'zooshansDebtValue',
    'modalContainer', 'modalTitle', 'modalDescription', 'modalChoices', 'actionButtonsContainer', 'activePetBadge',
    'logEntries'
  ];
  ids.forEach(id => { domElements[id] = mockElement(id); });

  const context = {
    console, window: {},
    document: {
      getElementById: (id) => domElements[id] || (domElements[id] = mockElement(id)),
      createElement: (tag) => mockElement(tag),
      body: mockElement('body'),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
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

const ctx = setupTestEnvironment();

console.log('--- Test 1: Partition of baseNames into male and female ---');
assert(ctx.FEMALE_BASE_NAMES, 'FEMALE_BASE_NAMES set must exist');
assert(ctx.MALE_BASE_NAMES, 'MALE_BASE_NAMES set must exist');

const allNames = ctx.window.GAME_DATA.petnames.baseNames;
allNames.forEach(name => {
  const isFem = ctx.FEMALE_BASE_NAMES.has(name);
  const isMale = ctx.MALE_BASE_NAMES.has(name);
  assert(isFem || isMale, `Name "${name}" must be categorized as either female or male`);
  assert(!(isFem && isMale), `Name "${name}" cannot be both female and male`);
});

console.log('--- Test 2: getRandomPetname strictly matches requested gender ---');
for (let i = 0; i < 100; i++) {
  const malePetname = ctx.getRandomPetname('male');
  const [baseM, ...restM] = malePetname.split(' ');
  const topoM = restM.join(' ');
  assert(ctx.MALE_BASE_NAMES.has(baseM), `Male petname base "${baseM}" must be in MALE_BASE_NAMES, got: "${malePetname}"`);
  assert(!ctx.FEMALE_BASE_NAMES.has(baseM), `Male petname base "${baseM}" must NOT be in FEMALE_BASE_NAMES`);
  if (topoM !== '72 Прушинских') {
    assert(!topoM.endsWith('ская') && !topoM.endsWith('цкая') && !topoM.endsWith('ная') && topoM !== 'Комарова', `Male toponym "${topoM}" must have masculine ending`);
  }

  const femalePetname = ctx.getRandomPetname('female');
  const [baseF, ...restF] = femalePetname.split(' ');
  const topoF = restF.join(' ');
  assert(ctx.FEMALE_BASE_NAMES.has(baseF), `Female petname base "${baseF}" must be in FEMALE_BASE_NAMES, got: "${femalePetname}"`);
  assert(!ctx.MALE_BASE_NAMES.has(baseF), `Female petname base "${baseF}" must NOT be in MALE_BASE_NAMES`);
  if (topoF !== '72 Прушинских') {
    assert(topoF.endsWith('ская') || topoF.endsWith('цкая') || topoF.endsWith('ная') || topoF === 'Комарова', `Female toponym "${topoF}" must have feminine ending`);
  }
}

console.log('--- Test 3: generateRandomAnimalScenario binds nickname to scenario gender ---');
const scMale = ctx.window.GAME_DATA.scenarios.find(s => s.species === 'cat' && s.gender === 'male' && s.ageCategory === 'adult');
const scFemale = ctx.window.GAME_DATA.scenarios.find(s => s.species === 'cat' && s.gender === 'female' && s.ageCategory === 'adult');

for (let i = 0; i < 50; i++) {
  const maleAnimal = ctx.generateRandomAnimalScenario(scMale);
  const [baseM] = maleAnimal.petName.split(' ');
  assert(ctx.MALE_BASE_NAMES.has(baseM), `Generated male scenario animal must have male name, got "${maleAnimal.petName}"`);

  const femaleAnimal = ctx.generateRandomAnimalScenario(scFemale);
  const [baseF] = femaleAnimal.petName.split(' ');
  assert(ctx.FEMALE_BASE_NAMES.has(baseF), `Generated female scenario animal must have female name, got "${femaleAnimal.petName}"`);
}

console.log('✅ All petnames gender-binding tests passed!');
