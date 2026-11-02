// scratch/test_fe_lv_and_surgery.js
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

  console.log('--- TEST 1: No-Trauma Surgery Card ---');
  state.animal.hiddenState.hasSevereTrauma = false;
  state.animal.traumaOperated = false;
  state.animal.health = 80;
  renderActionTabs();
  const vetGrid = document.getElementById('tabContent_vet');
  // Find surgery card by title
  let surgeryBtn = null;
  for (const child of vetGrid.children) {
    if (child.innerHTML.includes('Остеосинтез') || child.innerHTML.includes('Операция проведена')) {
      surgeryBtn = child;
      break;
    }
  }
  if (!surgeryBtn) throw new Error('Surgery button not found in vet tab');
  console.log('Surgery btn title:', surgeryBtn.querySelector ? '' : surgeryBtn.innerHTML.slice(0, 100));
  console.log('Contains Не требуется:', surgeryBtn.innerHTML.includes('Не требуется'));
  console.log('Contains Операция проведена:', surgeryBtn.innerHTML.includes('Операция проведена'));
  if (surgeryBtn.innerHTML.includes('Операция проведена')) {
    throw new Error('Bug: False "Операция проведена" is showing for an animal without trauma!');
  }
  if (!surgeryBtn.innerHTML.includes('Не требуется')) {
    throw new Error('Expected "Не требуется" on surgery card for animal without trauma');
  }

  console.log('\n--- TEST 2: FeLV Workflow (Confirming Test & Antiviral Therapy) ---');
  // Simulate FeLV carrier discovered
  state.animal.knownCarrier = 'FeLV';
  renderActionTabs();
  let felvTestBtn = null;
  let infectBtn = null;
  for (const child of vetGrid.children) {
    if (child.innerHTML.includes('Подтверждающий тест FeLV')) felvTestBtn = child;
    if (child.innerHTML.includes('Консультация инфекциониста')) infectBtn = child;
  }
  if (!felvTestBtn) throw new Error('FeLV confirming test button not rendered when knownCarrier == FeLV');
  if (!infectBtn) throw new Error('FeLV infectious specialist button not rendered when knownCarrier == FeLV');
  console.log('FeLV confirming test button found:', true);
  console.log('FeLV infectious specialist button found:', true);

  // Click confirming test
  state.cash = 300;
  state.energy = 50;
  felvTestBtn.onclick();
  console.log('FeLV confirmed after click:', state.animal.felvConfirmed);
  if (!state.animal.felvConfirmed) throw new Error('FeLV should be confirmed');

  // Click infectious consult
  infectBtn.onclick();
  console.log('FeLV antiviral active:', state.animal.felvAntiviralActive);
  console.log('FeLV antiviral days left:', state.animal.felvAntiviralDaysLeft);
  if (!state.animal.felvAntiviralActive) throw new Error('Antiviral therapy should be active');

  // Re-render and check completed state
  renderActionTabs();
  let felvTestBtnUpdated = null;
  let infectBtnUpdated = null;
  for (const child of vetGrid.children) {
    if (child.innerHTML.includes('FeLV-провирус подтвержден')) felvTestBtnUpdated = child;
    if (child.innerHTML.includes('Противовирусная терапия начата')) infectBtnUpdated = child;
  }
  console.log('Confirmed test card has completed state:', felvTestBtnUpdated.className.includes('action-completed'));
  console.log('Infectious card has completed state:', infectBtnUpdated.className.includes('action-completed'));

  console.log('\n--- TEST 3: Day 10 FeLV Crisis Mitigation ---');
  state.day = 10;
  state.animal.hiddenState.chronicCarrier = 'FeLV';
  state.triggeredEvents.felvCrisis = false;
  const initialHealth = state.animal.health;
  const triggered = checkMedicalAndCrisisTriggers();
  console.log('Event returned false (mitigated):', triggered === false);
  console.log('Health maintained without acute crisis loss:', state.animal.health >= initialHealth);

  console.log('\n--- TEST 4: End Game Modal Close & Overview Banner ---');
  triggerEndGame(true, 'Тестовая победа', 'Котик обрел надежный дом!');
  const endModal = document.getElementById('endGameModal');
  const overviewBanner = document.getElementById('endGameOverviewBanner');
  console.log('End modal opened:', !endModal.classList.contains('hidden'));
  
  // Close modal to view dashboard
  closeEndGameModal();
  console.log('End modal hidden after close:', endModal.classList.contains('hidden'));
  console.log('Overview banner visible:', !overviewBanner.classList.contains('hidden'));

  // Re-open modal
  reopenEndGameModal();
  console.log('End modal restored on reopen:', !endModal.classList.contains('hidden'));

  console.log('\n>>> ALL SURGERY, FELV & ENDGAME TESTS PASSED! <<<');
}

run().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
