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
    id,
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    setAttribute: () => {},
    removeAttribute: () => {},
    addEventListener: () => {},
    appendChild: () => {},
    removeChild: () => {},
    focus: () => {},
    children: []
  });

  const ids = [
    'cashValue', 'mentalBar', 'mentalValue', 'energyBar', 'energyValue', 'healthBar', 'healthValue',
    'foodStockDays', 'feedReserveDays', 'calendarDay', 'activeCuratorName', 'activePetTitle', 'activePetBreed',
    'activePetCoat', 'activePetArchetype', 'activePetAge', 'activePetStory', 'zooshansDebtLimit', 'zooshansDebtValue',
    'modalContainer', 'modalTitle', 'modalDescription', 'modalChoices', 'actionButtonsContainer', 'activePetBadge',
    'logEntries', 'tabContent_vet', 'tabContent_zooshans', 'tabContent_care'
  ];
  ids.forEach(id => {
    domElements[id] = mockElement(id);
  });

  const context = {
    console,
    window: {},
    document: {
      getElementById: (id) => domElements[id] || (domElements[id] = mockElement(id)),
      createElement: (tag) => mockElement(tag),
      body: mockElement('body'),
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
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

console.log('--- Test 1: Button presence in vet tab when ownPets.id is unvaccinated_cat ---');
const ctx = setupTestEnvironment();
ctx.startNewRun(false);

// Ensure ownPets is unvaccinated_cat
ctx.state.player.ownPets = {
  id: 'unvaccinated_cat',
  label: 'Мой свой кот (не привит!)',
  infectionRisk: 'critical',
  treatmentCost: 215
};

let capturedVetButtons = [];
const origRenderButtonGrid = ctx.renderButtonGrid;
ctx.renderButtonGrid = (containerId, buttons) => {
  if (containerId === 'tabContent_vet') {
    capturedVetButtons = buttons;
  }
  if (origRenderButtonGrid) origRenderButtonGrid(containerId, buttons);
};

ctx.renderActionTabs();

const ownCatBtn = capturedVetButtons.find(b => b.title === 'Вакцинация домашнего кота');
assert(ownCatBtn, 'Action card "Вакцинация домашнего кота" must be present in vet tab');
assert.strictEqual(ownCatBtn.costBYN, 60, 'Cost must be 60 BYN');
assert.strictEqual(ownCatBtn.costEnergy, 10, 'Energy cost must be 10⚡');
assert.strictEqual(ownCatBtn.isVoucherEligible, false, 'isVoucherEligible must be false');
assert.strictEqual(ownCatBtn.state, 'active', 'Button state must be active');
assert.strictEqual(typeof ctx.actionVaccinateOwnCat, 'function', 'actionVaccinateOwnCat function must exist');

console.log('--- Test 2: Successful execution of actionVaccinateOwnCat ---');
ctx.state.cash = 100;
ctx.state.energy = 25;
ctx.state.personalMoneySpent = 0;
const initialCash = ctx.state.cash;
const initialEnergy = ctx.state.energy;

ctx.actionVaccinateOwnCat();

assert.strictEqual(ctx.state.cash, initialCash - 60, 'Should deduct exactly 60 BYN from cash');
assert.strictEqual(ctx.state.personalMoneySpent, 60, 'Should add 60 BYN to personalMoneySpent');
assert.strictEqual(ctx.state.energy, initialEnergy - 10, 'Should deduct 10 energy');
assert.strictEqual(ctx.state.player.ownPets.id, 'vaccinated_cat', 'ownPets.id should transition to vaccinated_cat');
assert.strictEqual(ctx.state.player.ownPets.infectionRisk, 'low', 'ownPets.infectionRisk should transition to low');
assert.strictEqual(ctx.state.player.ownPets.vaccinatedAtDay, ctx.state.day, 'vaccinatedAtDay should be set to current day');

// Check that the button switches to completed state
ctx.renderActionTabs();
const ownCatBtnCompleted = capturedVetButtons.find(b => b.title === 'Вакцинация домашнего кота');
assert(ownCatBtnCompleted, 'Button should still be present in vet tab');
assert.strictEqual(ownCatBtnCompleted.state, 'completed', 'Button state should switch to completed');
assert.strictEqual(ownCatBtnCompleted.costBYN, 0, 'Completed card costBYN should be 0');
assert.strictEqual(ownCatBtnCompleted.costEnergy, 0, 'Completed card costEnergy should be 0');

console.log('--- Test 3: Insufficient funds block ---');
ctx.startNewRun(false);
ctx.state.player.ownPets = {
  id: 'unvaccinated_cat',
  label: 'Мой свой кот (не привит!)',
  infectionRisk: 'critical',
  treatmentCost: 215
};
ctx.state.cash = 30; // less than 60
ctx.state.energy = 20;
ctx.state.personalMoneySpent = 0;

ctx.actionVaccinateOwnCat();

assert.strictEqual(ctx.state.cash, 30, 'Cash must not change when insufficient funds');
assert.strictEqual(ctx.state.energy, 20, 'Energy must not change when insufficient funds');
assert.strictEqual(ctx.state.player.ownPets.id, 'unvaccinated_cat', 'ownPets.id must remain unvaccinated_cat');

console.log('--- Test 4: Insufficient energy block ---');
ctx.startNewRun(false);
ctx.state.player.ownPets = {
  id: 'unvaccinated_cat',
  label: 'Мой свой кот (не привит!)',
  infectionRisk: 'critical',
  treatmentCost: 215
};
ctx.state.cash = 100;
ctx.state.energy = 5; // less than 10

ctx.actionVaccinateOwnCat();

assert.strictEqual(ctx.state.cash, 100, 'Cash must not change when insufficient energy');
assert.strictEqual(ctx.state.energy, 5, 'Energy must not change when insufficient energy');
assert.strictEqual(ctx.state.player.ownPets.id, 'unvaccinated_cat', 'ownPets.id must remain unvaccinated_cat');

console.log('--- Test 5: Virus outbreak does NOT trigger 215 BYN penalty after vaccination ---');
ctx.startNewRun(false);
ctx.state.player.ownPets = {
  id: 'unvaccinated_cat',
  label: 'Мой свой кот (не привит!)',
  infectionRisk: 'critical',
  treatmentCost: 215
};
ctx.state.cash = 300;
ctx.state.energy = 50;
ctx.state.animal.species = 'cat';
ctx.state.zooshans.locationStatus = 'home_floor';
ctx.state.animal.hiddenState.deadlyVirus = 'panleukopenia';
ctx.state.animal.hiddenState.virusIncubationDays = 4;
ctx.state.day = 4;

// Vaccinate own cat
ctx.actionVaccinateOwnCat();
const cashAfterVac = ctx.state.cash;
const spentAfterVac = ctx.state.personalMoneySpent;

// Trigger crisis events (virus outbreak)
ctx.checkMedicalAndCrisisTriggers();

// Cash should NOT have the 215 BYN penalty deducted
assert.strictEqual(ctx.state.cash, cashAfterVac, 'Cash should not be penalized by 215 BYN for vaccinated own cat');
assert.strictEqual(ctx.state.personalMoneySpent, spentAfterVac, 'personalMoneySpent should not increase by 215 BYN');

console.log('--- Test 6: Button is NOT displayed when ownPets.id is "none" or initially "vaccinated_cat" ---');
ctx.startNewRun(false);
ctx.state.player.ownPets = {
  id: 'none',
  label: 'Не было животных дома',
  infectionRisk: 'none'
};

ctx.renderActionTabs();
const ownCatBtnNone = capturedVetButtons.find(b => b.title === 'Вакцинация домашнего кота');
assert.strictEqual(ownCatBtnNone, undefined, 'Button should NOT be displayed when player has no pets');

ctx.state.player.ownPets = {
  id: 'vaccinated_cat',
  label: 'Мой свой кот (привит)',
  infectionRisk: 'low'
  // vaccinatedAtDay undefined
};
ctx.renderActionTabs();
const ownCatBtnInitVac = capturedVetButtons.find(b => b.title === 'Вакцинация домашнего кота');
assert.strictEqual(ownCatBtnInitVac, undefined, 'Button should NOT be displayed when cat was already vaccinated before game');

console.log('All tests passed successfully!');
