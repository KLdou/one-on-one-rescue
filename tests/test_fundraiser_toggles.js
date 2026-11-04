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
    'logEntries', 'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'tab1Badge', 'tab2Badge', 'tab3Badge',
    'deadlinesRadarList', 'mobileRadarBadge'
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

console.log('Testing Personal and Official Fundraiser Toggles...');

// Test 1: Action functions exist
{
  const ctx = setupTestEnvironment();
  assert.strictEqual(typeof ctx.actionTogglePersonalFundraiser, 'function', 'actionTogglePersonalFundraiser must be a function');
  assert.strictEqual(typeof ctx.actionToggleOfficialFundraiser, 'function', 'actionToggleOfficialFundraiser must be a function');
}

// Test 2: Toggle personal fundraiser (open, tick, close, tick)
{
  const ctx = setupTestEnvironment();
  ctx.startNewRun(false);
  ctx.state.energy = 80;
  ctx.state.zooshans.personalFundraiserActive = false;
  ctx.state.zooshans.personalDonationsBanned = false;
  ctx.state.zooshans.personalCardCollectedBYN = 100;
  ctx.state.zooshans.daysSinceLastFinReport = 0;

  // Verify Radar while closed
  let radarItems = ctx.getRadarItems();
  let finRadar = radarItems.find(item => item.title === 'Финотчет по сбору');
  assert.strictEqual(finRadar, undefined, 'Radar should NOT list fin report deadline when personal fundraiser is closed');

  // Open personal fundraiser
  const initialEnergy = ctx.state.energy;
  ctx.actionTogglePersonalFundraiser();
  assert.strictEqual(ctx.state.zooshans.personalFundraiserActive, true, 'Personal fundraiser should be active after opening');
  assert.strictEqual(ctx.state.energy, initialEnergy - 15, 'Opening personal fundraiser costs 15 energy');
  assert.strictEqual(ctx.state.zooshans.daysSinceLastFinReport, 0, 'daysSinceLastFinReport should reset to 0 upon opening');

  // Verify Radar while open
  radarItems = ctx.getRadarItems();
  finRadar = radarItems.find(item => item.title === 'Финотчет по сбору');
  assert.notStrictEqual(finRadar, undefined, 'Radar should list fin report deadline when personal fundraiser is open');

  // Tick a day while open
  const startCollected = ctx.state.zooshans.personalCardCollectedBYN;
  // Force Math.random in context to generate donation
  const origRandom = ctx.Math.random;
  ctx.Math.random = () => 0.1; // <= 0.50 triggers donation in engine.js
  ctx.processDayTick();
  ctx.Math.random = origRandom;

  assert.strictEqual(ctx.state.zooshans.daysSinceLastFinReport, 1, 'daysSinceLastFinReport should increment after day tick while active');
  assert.ok(ctx.state.zooshans.personalCardCollectedBYN >= startCollected, 'Donations collected should not decrease');

  // Close personal fundraiser (costs 0 energy)
  const energyBeforeClose = ctx.state.energy;
  ctx.actionTogglePersonalFundraiser();
  assert.strictEqual(ctx.state.zooshans.personalFundraiserActive, false, 'Personal fundraiser should be closed after toggle');
  assert.strictEqual(ctx.state.energy, energyBeforeClose, 'Closing personal fundraiser should cost 0 energy');

  // Tick day while closed
  const daysSinceBefore = ctx.state.zooshans.daysSinceLastFinReport;
  const collectedBefore = ctx.state.zooshans.personalCardCollectedBYN;
  ctx.processDayTick();

  assert.strictEqual(ctx.state.zooshans.daysSinceLastFinReport, daysSinceBefore, 'daysSinceLastFinReport must NOT increment when fundraiser is closed');
  assert.strictEqual(ctx.state.zooshans.personalCardCollectedBYN, collectedBefore, 'No card donations should be collected when closed');

  // Radar check after close with collectedBYN > 0
  radarItems = ctx.getRadarItems();
  finRadar = radarItems.find(item => item.title === 'Финотчет по сбору');
  assert.strictEqual(finRadar, undefined, 'Radar should NOT list fin report deadline when personal fundraiser is closed even if collectedBYN > 0');
}

// Test 3: Personal fundraiser restrictions (banned, limit)
{
  const ctx = setupTestEnvironment();
  ctx.startNewRun(false);
  ctx.state.energy = 50;
  ctx.state.zooshans.personalFundraiserActive = false;

  // Banned
  ctx.state.zooshans.personalDonationsBanned = true;
  ctx.actionTogglePersonalFundraiser();
  assert.strictEqual(ctx.state.zooshans.personalFundraiserActive, false, 'Should not open if banned');
  assert.strictEqual(ctx.state.energy, 50, 'No energy spent if banned');

  // Limit reached
  ctx.state.zooshans.personalDonationsBanned = false;
  ctx.state.zooshans.personalCardCollectedBYN = 6500;
  ctx.actionTogglePersonalFundraiser();
  assert.strictEqual(ctx.state.zooshans.personalFundraiserActive, false, 'Should not open if 6500 limit reached');
  assert.strictEqual(ctx.state.energy, 50, 'No energy spent if limit reached');
}

// Test 4: Official fundraiser toggle (eligibility, opening, closing)
{
  const ctx = setupTestEnvironment();
  ctx.startNewRun(false);
  ctx.state.energy = 60;
  ctx.state.zooshans.officialFundraiserActive = false;
  ctx.state.zooshans.voucherDebt = 0;
  ctx.state.zooshans.expensiveApproved = false;
  if (!ctx.state.animal.hiddenState) ctx.state.animal.hiddenState = {};
  ctx.state.animal.hiddenState.hasSevereTrauma = false;

  // Not eligible -> should not open
  ctx.actionToggleOfficialFundraiser();
  assert.strictEqual(ctx.state.zooshans.officialFundraiserActive, false, 'Should not open if not eligible');
  assert.strictEqual(ctx.state.energy, 60, 'No energy spent if not eligible');

  // Eligible with debt >= 330
  ctx.state.zooshans.voucherDebt = 350;
  ctx.actionToggleOfficialFundraiser();
  assert.strictEqual(ctx.state.zooshans.officialFundraiserActive, true, 'Official fundraiser should open when debt >= 330');
  assert.strictEqual(ctx.state.energy, 45, 'Opening official fundraiser should cost 15 energy');

  // Close official fundraiser (cost 0 energy)
  ctx.actionToggleOfficialFundraiser();
  assert.strictEqual(ctx.state.zooshans.officialFundraiserActive, false, 'Official fundraiser should close on toggle');
  assert.strictEqual(ctx.state.energy, 45, 'Closing official fundraiser should cost 0 energy');

  // Eligible with severe trauma
  ctx.state.zooshans.voucherDebt = 0;
  ctx.state.animal.hiddenState.hasSevereTrauma = true;
  ctx.state.animal.traumaOperated = false;
  ctx.actionToggleOfficialFundraiser();
  assert.strictEqual(ctx.state.zooshans.officialFundraiserActive, true, 'Official fundraiser should open when animal has unoperated severe trauma');
  assert.strictEqual(ctx.state.energy, 30, 'Opening official fundraiser should cost 15 energy');

  // Close again
  ctx.actionToggleOfficialFundraiser();
  assert.strictEqual(ctx.state.zooshans.officialFundraiserActive, false, 'Official fundraiser should close');
  assert.strictEqual(ctx.state.energy, 30, 'Closing should cost 0 energy');
}

// Test 5: UI buttons rendering & behavior in tabContent_zooshans
{
  const ctx = setupTestEnvironment();
  ctx.startNewRun(false);

  let capturedZooButtons = null;
  ctx.renderButtonGrid = (containerId, buttons) => {
    if (containerId === 'tabContent_zooshans') {
      capturedZooButtons = buttons;
    }
  };

  // 5.1 When both closed
  ctx.state.zooshans.personalFundraiserActive = false;
  ctx.state.zooshans.officialFundraiserActive = false;
  ctx.state.zooshans.voucherDebt = 0;
  if (!ctx.state.animal.hiddenState) ctx.state.animal.hiddenState = {};
  ctx.state.animal.hiddenState.hasSevereTrauma = false;

  ctx.renderActionTabs();
  assert(capturedZooButtons, 'tabContent_zooshans buttons must be captured');

  let officialBtn = capturedZooButtons.find(b => b.title === 'Сбор на р/с «Зоошанса»' || b.title === 'Закрыть сбор на р/с');
  assert(officialBtn, 'Official button must exist');
  assert.strictEqual(officialBtn.title, 'Сбор на р/с «Зоошанса»');
  assert.strictEqual(officialBtn.badge, 'Официальный');
  assert.strictEqual(officialBtn.state, 'locked');
  assert.strictEqual(officialBtn.costEnergy, 15);

  let personalBtn = capturedZooButtons.find(b => b.title === 'Сбор на личную карту' || b.title === 'Закрыть сбор на карту');
  assert(personalBtn, 'Personal card button must exist');
  assert.strictEqual(personalBtn.title, 'Сбор на личную карту');
  assert.strictEqual(personalBtn.badge, 'До 6500 BYN');
  assert.strictEqual(personalBtn.state, 'active');
  assert.strictEqual(personalBtn.costEnergy, 15);

  // 5.2 When both active
  ctx.state.zooshans.personalFundraiserActive = true;
  ctx.state.zooshans.officialFundraiserActive = true;

  ctx.renderActionTabs();
  officialBtn = capturedZooButtons.find(b => b.title === 'Сбор на р/с «Зоошанса»' || b.title === 'Закрыть сбор на р/с');
  assert(officialBtn, 'Official button must exist when active');
  assert.strictEqual(officialBtn.title, 'Закрыть сбор на р/с');
  assert.strictEqual(officialBtn.badge, 'Р/С открыт');
  assert.strictEqual(officialBtn.state, 'active');
  assert.strictEqual(officialBtn.costEnergy, 0);
  assert.strictEqual(officialBtn.onClick, ctx.actionToggleOfficialFundraiser);

  personalBtn = capturedZooButtons.find(b => b.title === 'Сбор на личную карту' || b.title === 'Закрыть сбор на карту');
  assert(personalBtn, 'Personal card button must exist when active');
  assert.strictEqual(personalBtn.title, 'Закрыть сбор на карту');
  assert.strictEqual(personalBtn.badge, 'Активен');
  assert.strictEqual(personalBtn.state, 'active');
  assert.strictEqual(personalBtn.costEnergy, 0);
  assert.strictEqual(personalBtn.onClick, ctx.actionTogglePersonalFundraiser);
}

console.log('All fundraiser toggle tests passed successfully!');
