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
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); },
      contains(c) { return this._classes.has(c); }
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
    'logEntries', 'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'tab1Badge', 'tab2Badge', 'tab3Badge',
    'deadlinesRadarList', 'mobileRadarBadge', 'endGameModal', 'endModalBadge', 'endModalTitle', 'endModalDescription',
    'endModalMistakesCard', 'endModalMistakesText', 'savedAlbumModal', 'albumTrialList', 'savedAlbumList',
    'albumTrialCount', 'albumAdoptedCount', 'albumTotalCountText', 'headerAlbumCount'
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
      querySelector: () => null,
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
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    setInterval: () => 1,
    clearInterval: () => {},
    Math: Object.create(Math)
  };
  context.window = context;

  vm.createContext(context);
  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  return context;
}

console.log('--- TEST: 10-Day Old-Owner Search Auto-Progression for Lost / Purebred Pets ---');

const ctx = setupTestEnvironment();

// Find a purebred/lost scenario from GAME_DATA
const purebredScenario = ctx.GAME_DATA.scenarios.find(s => s.hiddenState && s.hiddenState.isLostOrPurebred);
assert(purebredScenario, 'A scenario with isLostOrPurebred: true must exist in scenarios.json');

ctx.startNewRun(false, purebredScenario);

assert(ctx.state.animal.hiddenState.isLostOrPurebred, 'Hidden state must have isLostOrPurebred: true');
assert.strictEqual(ctx.state.pr.lostSearchActive, true, 'lostSearchActive must be true on run start for lost/purebred');
assert.strictEqual(ctx.state.pr.lostSearchDaysDone, 0, 'lostSearchDaysDone must start at 0');

let capturedCareButtons = null;
let capturedVetButtons = null;
const origRenderButtonGrid = ctx.renderButtonGrid;
ctx.renderButtonGrid = (containerId, buttons) => {
  if (containerId === 'tabContent_care') {
    capturedCareButtons = buttons;
  }
  if (containerId === 'tabContent_vet') {
    capturedVetButtons = buttons;
  }
  if (origRenderButtonGrid) origRenderButtonGrid(containerId, buttons);
};

// ------------------------------------------------------------------------
// Test 1: Day 1 initial UI checks (PR locked with 0/10, Radar shows 10 days)
// ------------------------------------------------------------------------
console.log('Test 1: Day 1 PR button and Radar state...');
ctx.renderActionTabs();
assert(capturedCareButtons, 'Care buttons must be rendered');

const prBtnDay1 = capturedCareButtons.find(b => b.title.includes('Поиск старых хозяев') || b.title.includes('ПИАР'));
assert(prBtnDay1, 'PR button must exist in careButtons');
assert.strictEqual(prBtnDay1.state, 'locked', 'PR button must be locked on Day 1 for lost pet');
assert.strictEqual(prBtnDay1.title, 'Поиск старых хозяев (ст. 231 ГК РБ)');
assert.strictEqual(prBtnDay1.badge, '0/10 дн.');
assert.strictEqual(prBtnDay1.statusText, '🔒 Поиск хозяев (0/10 дн.)');
assert(prBtnDay1.sub.includes('ст. 231 ГК РБ') || prBtnDay1.sub.includes('10 дней'), 'Subtext must mention 10-day rule');

// Radar check
const radarDay1 = typeof ctx.getRadarItems === 'function' ? ctx.getRadarItems() : [];
const lostRadarDay1 = radarDay1.find(item => item.title.includes('Поиск хозяев (ст. 231)'));
assert(lostRadarDay1, 'Radar item for old-owner search must exist on Day 1');
assert.strictEqual(lostRadarDay1.daysLeft || lostRadarDay1.days, 10, 'Radar must show 10 days left on Day 1');

// ------------------------------------------------------------------------
// Test 2: Progressing ticks 1 to 9 (auto-increment, scam triggers on 3 & 6)
// ------------------------------------------------------------------------
console.log('Test 2: Auto-progression ticks and scam triggers on days 3 and 6...');

let scamModalTriggeredCount = 0;
let lastCallTriggered = null;
ctx.triggerIncomingCallModal = (callData, isOldOwnerSearch) => {
  scamModalTriggeredCount++;
  lastCallTriggered = callData;
  assert.strictEqual(isOldOwnerSearch, true, 'isOldOwnerSearch should be true');
};

// Keep random > 0.30 for ticks so no surprise early exit
ctx.Math.random = () => 0.50;

// Prevent hunger/critical health collapse or unrelated random landlord visits during simulation
ctx.state.player.housing = ctx.GAME_DATA.playerAxes.housing.find(h => h.id === 'own_flat') || { id: 'own_flat' };
ctx.state.supplies.daysLeft = 50;
ctx.state.animal.health = 100;
ctx.state.energy = 50;
ctx.state.mental = 100;

for (let tick = 1; tick <= 9; tick++) {
  ctx.processDayTick();
  assert.strictEqual(ctx.state.pr.lostSearchDaysDone, tick, `lostSearchDaysDone should be ${tick} after tick ${tick}`);

  if (tick === 3) {
    assert.strictEqual(scamModalTriggeredCount, 1, 'Scam call 1 must trigger on tick 3 (day 3 of search)');
    assert(ctx.state.triggeredEvents['scam_3'], 'scam_3 event flag must be set');
  } else if (tick === 6) {
    assert.strictEqual(scamModalTriggeredCount, 2, 'Scam call 2 must trigger on tick 6 (day 6 of search)');
    assert(ctx.state.triggeredEvents['scam_6'], 'scam_6 event flag must be set');
  }

  // Check radar item during ticks 1..9
  const currentRadar = typeof ctx.getRadarItems === 'function' ? ctx.getRadarItems() : [];
  const radarItem = currentRadar.find(item => item.title.includes('Поиск хозяев (ст. 231)'));
  assert(radarItem, `Radar item must exist on tick ${tick}`);
  assert.strictEqual(radarItem.daysLeft || radarItem.days, 10 - tick, `Radar days left must be ${10 - tick} on tick ${tick}`);
}

// ------------------------------------------------------------------------
// Test 3: Day 10 search completion (Unblocks PR and sterilization when roll >= 0.30)
// ------------------------------------------------------------------------
console.log('Test 3: Day 10 search completion without old owner match...');

ctx.Math.random = () => 0.50; // >= 0.30 => owner does not return
ctx.processDayTick();

assert.strictEqual(ctx.state.pr.lostSearchDaysDone, 10, 'lostSearchDaysDone should be 10');
assert.strictEqual(ctx.state.pr.lostSearchActive, false, 'lostSearchActive must become false on completion');

// Radar item should no longer be present
const radarDay10 = typeof ctx.getRadarItems === 'function' ? ctx.getRadarItems() : [];
const lostRadarDay10 = radarDay10.find(item => item.title.includes('Поиск хозяев (ст. 231)'));
assert(!lostRadarDay10, 'Radar item must be removed once 10 days are completed');

// Prepare pet prerequisites to verify PR is unblocked
ctx.state.animal.examinedWood = true;
ctx.state.animal.knownRingworm = false;
ctx.state.animal.quarantineDaysDone = 14;
ctx.state.animal.dewormStage = 2;
ctx.state.animal.parasitesAndVaccinated = true;
ctx.state.animal.isSterilized = true;
ctx.state.animal.inStationaryDaysLeft = 0;
ctx.state.animal.virusRecoveryDaysLeft = 0;
ctx.state.animal.traumaRehabDaysLeft = 0;

ctx.renderActionTabs();
const prBtnDay10 = capturedCareButtons.find(b => b.title.includes('ПИАР') || b.title.includes('Поиск старых хозяев'));
assert(prBtnDay10, 'PR button must exist');
assert.strictEqual(prBtnDay10.state, 'active', 'PR button must be active now that 10 days are done and checklist complete');
assert(prBtnDay10.title.includes('ПИАР'), 'PR button title should be regular PR');

// Verify sterilization is also unblocked
ctx.state.animal.isSterilized = false; // check spay button
ctx.renderActionTabs();
const spayBtn = capturedVetButtons.find(b => b.title.includes('Стерилизация') || b.title.includes('Кастрация'));
assert(spayBtn, 'Sterilization button must exist');
assert.notStrictEqual(spayBtn.statusText, '🔒 Поиск хозяев (10/10 дн.)', 'Spay button must not be locked by lost search on day 10');

// ------------------------------------------------------------------------
// Test 4: Day 10 search completion with old owner match (roll < 0.30 -> victory)
// ------------------------------------------------------------------------
console.log('Test 4: Day 10 old owner match (roll < 0.30)...');

const ctxOwner = setupTestEnvironment();
ctxOwner.startNewRun(false, purebredScenario);
ctxOwner.state.pr.lostSearchDaysDone = 9;
ctxOwner.state.supplies.daysLeft = 50;
ctxOwner.state.animal.health = 100;

let modalShown = false;
ctxOwner.showEventModal = (title, desc, choices) => {
  modalShown = true;
  assert(title.includes('СТАРЫЕ ХОЗЯЕВА НАЙДЕНЫ'), 'Title must announce old owners found');
};

ctxOwner.Math.random = () => 0.10; // < 0.30 => owner returns
ctxOwner.processDayTick();

assert.strictEqual(ctxOwner.state.gameOver, true, 'Game must be over');
assert.strictEqual(ctxOwner.state.victory, true, 'Victory flag must be set');
assert(modalShown, 'Event modal must be shown');
assert(ctxOwner.state.savedTails.some(t => t.petName === ctxOwner.state.animal.petName), 'Saved tails must record the pet');
assert(ctxOwner.state.rescuedPets.some(t => t.petName === ctxOwner.state.animal.petName), 'rescuedPets must record the pet');

console.log('✓ All purebred / lost pet search tests passed successfully!');
