// scratch/test_litters_and_formula.js
const fs = require('fs');
const path = require('path');

// Mock minimal DOM
const elements = {};
function createMockElement(id = '', tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    textContent: '',
    _innerHTML: '',
    title: '',
    className: '',
    disabled: false,
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    appendChild(child) {
      this.children.push(child);
    },
    children: []
  };

  Object.defineProperty(el, 'innerHTML', {
    get() { return this._innerHTML; },
    set(val) {
      this._innerHTML = val;
      if (val === '') this.children = [];
    }
  });

  return el;
}

global.document = {
  addEventListener() {},
  body: {
    setAttribute() {},
    classList: { add() {}, remove() {} }
  },
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  createElement(tag) {
    return createMockElement('', tag);
  }
};

global.window = {
  document: global.document,
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
global.localStorage = global.window.localStorage;

// Load scripts
const baseDir = path.resolve('d:/projects/volontiers/game_modular/js');
const scriptFiles = [
  'data_loader.js',
  'state.js',
  'engine.js',
  'events.js',
  'actions.js',
  'adopters.js',
  'ui.js'
];

for (const file of scriptFiles) {
  const filePath = path.join(baseDir, file);
  eval(fs.readFileSync(filePath, 'utf8'));
}

async function run() {
  await loadGameDataAsync();
  startNewRun();

  console.log('--- TEST 1: Litter Pet Name is Initially Null ---');
  // Scenario: newborn_blind_kittens
  const litterRaw = window.GAME_DATA.scenarios.find(s => s.id === 'newborn_blind_kittens');
  if (!litterRaw) throw new Error('newborn_blind_kittens scenario not found');
  const litterAnimal = generateRandomAnimalScenario(litterRaw);
  console.log('Litter initial count:', litterAnimal.count);
  console.log('Litter initial petName:', litterAnimal.petName);
  if (litterAnimal.petName !== null) {
    throw new Error('Litter of multiple kittens should start with petName: null (without individual name)!');
  }

  // Set up state with this litter
  state.animal = litterAnimal;
  state.newborn.active = true;
  state.newborn.milkDaysLeft = 3;
  renderAll();
  
  const headerName = document.getElementById('headerPetName').textContent;
  console.log('Header name for litter:', headerName);
  if (!headerName.includes('Выводок котят (4 шт.)')) {
    throw new Error('Expected "Выводок котят (4 шт.)" in header when petName is null');
  }

  console.log('\n--- TEST 2: Kitten Formula Button in Tab 3 is Active ---');
  renderActionTabs();
  const careGrid = document.getElementById('tabContent_care');
  let formulaBtn = null;
  let foodBtn = null;
  for (const child of careGrid.children) {
    if (child.innerHTML.includes('Смесь Babycat Milk')) formulaBtn = child;
    if (child.innerHTML.includes('Запас корма')) foodBtn = child;
  }
  if (!foodBtn) throw new Error('Regular food button not found in Tab 3');
  if (!formulaBtn) throw new Error('Babycat Milk formula button NOT FOUND in Tab 3!');
  console.log('Regular food button present:', true);
  console.log('Babycat formula button present in Tab 3:', true);

  console.log('\n--- TEST 3: Sidebar Milk Supply Box Visible ---');
  const milkBox = document.getElementById('milkSupplyBox');
  const milkLabel = document.getElementById('milkSupplyLabel');
  console.log('Sidebar milk box hidden class:', milkBox.classList.contains('hidden'));
  console.log('Sidebar milk label:', milkLabel.textContent);
  if (milkBox.classList.contains('hidden')) {
    throw new Error('Sidebar milk supply box should be visible for kittens!');
  }
  if (!milkLabel.textContent.includes('3 дн.')) {
    throw new Error('Sidebar milk label should reflect 3 days');
  }

  console.log('\n--- TEST 4: Buy Formula Action ---');
  state.cash = 300;
  buyBabycatFormula();
  console.log('Milk days after buying 1 can (+7):', state.newborn.milkDaysLeft);
  if (state.newborn.milkDaysLeft !== 10) throw new Error('Expected 10 days of milk');

  console.log('\n--- TEST 5: Formula Button Remains Active Even When Moved to Paid Foster ---');
  state.zooshans.locationStatus = 'paid_foster';
  renderAll();
  let formulaBtnFoster = null;
  for (const child of careGrid.children) {
    if (child.innerHTML.includes('Смесь Babycat Milk')) formulaBtnFoster = child;
  }
  if (!formulaBtnFoster) throw new Error('Formula button must remain active when kittens are on foster care!');
  console.log('Formula button still present on foster care:', true);

  console.log('\n--- TEST 6: Formula Button Remains Active After 21 Days (Weaning Phase) ---');
  state.animal.ageDays = 25;
  state.animal.ageCategory = 'kitten';
  state.newborn.active = false; // Weaned from nipple, now eating Babycat pate
  renderAll();
  let formulaBtnWeaned = null;
  for (const child of careGrid.children) {
    if (child.innerHTML.includes('Смесь Babycat Milk')) formulaBtnWeaned = child;
  }
  if (!formulaBtnWeaned) throw new Error('Formula / Babycat pate button must remain active during the entire growing-up phase!');
  console.log('Formula / Babycat pate button present for 25-day kittens:', true);

  console.log('\n--- TEST 7: Adoption of Kitten from Litter Gives Individual Name ---');
  const initialTrialCount = state.trialAnimals.length;
  finishTransferToTrial(1, { caller: 'Семья с детьми' }, {}, false);
  const newTrial = state.trialAnimals[state.trialAnimals.length - 1];
  console.log('Adopted kitten assigned petName:', newTrial.petName);
  if (!newTrial.petName || newTrial.petName.length === 0) {
    throw new Error('Adopted kitten from litter must be assigned their own individual name!');
  }

  console.log('\n>>> ALL LITTER & KITTEN FORMULA TESTS PASSED! <<<');
}

run().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
