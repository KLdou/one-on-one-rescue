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

  function createMockElement(id = '', tagName = 'div') {
    const classes = new Set();
    const elem = {
      id,
      tagName,
      style: {},
      dataset: {},
      _innerHTML: '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(val) {
        this._innerHTML = val;
        if (val === '') {
          this.children = [];
        }
      },
      textContent: '',
      value: '',
      checked: false,
      children: [],
      parentNode: null,
      setAttribute: (k, v) => { elem[k] = v; },
      removeAttribute: (k) => { delete elem[k]; },
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      get className() {
        return Array.from(classes).join(' ');
      },
      set className(val) {
        classes.clear();
        if (val) {
          val.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
        }
      },
      classList: {
        add: (...cls) => cls.forEach(c => classes.add(c)),
        remove: (...cls) => cls.forEach(c => classes.delete(c)),
        toggle: (c) => {
          if (classes.has(c)) {
            classes.delete(c);
            return false;
          }
          classes.add(c);
          return true;
        },
        contains: (c) => classes.has(c)
      }
    };
    return elem;
  }

  function getOrCreateElem(id) {
    if (!domElements[id]) {
      domElements[id] = createMockElement(id);
    }
    return domElements[id];
  }

  const ids = [
    'cashValue', 'mentalBar', 'mentalValue', 'energyBar', 'energyValue', 'healthBar', 'healthValue',
    'foodStockDays', 'feedReserveDays', 'calendarDay', 'activeCuratorName', 'activePetTitle', 'activePetBreed',
    'activePetCoat', 'activePetArchetype', 'activePetAge', 'activePetStory', 'zooshansDebtLimit', 'zooshansDebtValue',
    'modalContainer', 'modalTitle', 'modalDescription', 'modalChoices', 'actionButtonsContainer', 'activePetBadge',
    'logEntries', 'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'dayCounter', 'calendarDateBadge',
    'acutePhaseBadge', 'headerPetAvatar', 'headerPetName', 'animalAgeBadge', 'seasonBadge', 'headerAlbumCount',
    'chronicleLog', 'endGameModal', 'endModalBadge', 'endModalTitle', 'endModalDescription', 'endModalMistakesCard',
    'endModalMistakesText', 'endModalCandidateMistakeBox', 'statDays', 'statPersonalSpent', 'statVoucherUsed', 'statFilteredCalls',
    'storyCardEmoji', 'storyCardTitle', 'storyCardSubtitle', 'storyCardStatDays', 'storyCardStatPersonal',
    'storyCardStatVoucher', 'storyCardStatFiltered', 'storyCardStatAlbum', 'btnCopyStoryCard', 'btnCopyWordleSummary',
    'endGameOverviewBanner', 'endBannerTitle', 'endBannerSubtitle', 'voucherDebtText', 'voucherTimerText', 'voucherDebtBar',
    'supplyDaysBadge', 'energyReserveLabel', 'realPracticeBadge', 'mobileRealPracticeBadge', 'chkRealPractice',
    'chkRealPracticeMobile'
  ];
  ids.forEach(id => getOrCreateElem(id));

  const timeouts = [];

  const context = {
    console,
    window: {},
    document: {
      getElementById: (id) => getOrCreateElem(id),
      createElement: (tag) => createMockElement('', tag),
      body: createMockElement('body'),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    navigator: {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    setTimeout: (fn, delay) => {
      timeouts.push({ fn, delay });
      return timeouts.length;
    },
    setInterval: () => 1,
    clearInterval: () => {},
    clearTimeout: () => {},
    alert: () => {}
  };

  context.window = context;
  context.global = context;

  vm.createContext(context);

  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context, { filename: file });
  });

  return {
    context,
    domElements
  };
}

function runTests() {
  console.log('--- TEST SUITE: Real Practice Progression & Energy Reserve Locks ---');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  test('1. When album has 0 or 1 rescued pet, realPracticeMode defaults to false', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    // Album with 0 pets
    context.localStorage.clear();
    context.resetState();
    assert.strictEqual(context.state.realPracticeMode, false, 'realPracticeMode should be false for 0 pets');

    // Album with 1 pet
    context.localStorage.setItem('zooshans_saved_album', JSON.stringify([{ id: 'pet1', petName: 'Барсик' }]));
    context.resetState();
    assert.strictEqual(context.state.realPracticeMode, false, 'realPracticeMode should be false for 1 pet');
  });

  test('2. When album has >= 2 rescued pets, realPracticeMode initializes to true', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.localStorage.setItem('zooshans_saved_album', JSON.stringify([
      { id: 'pet1', petName: 'Барсик' },
      { id: 'pet2', petName: 'Шарик' }
    ]));
    context.resetState();
    assert.strictEqual(context.state.realPracticeMode, true, 'realPracticeMode should be true for 2 pets');

    // Album with 5 pets
    context.localStorage.setItem('zooshans_saved_album', JSON.stringify([
      { id: 'pet1' }, { id: 'pet2' }, { id: 'pet3' }, { id: 'pet4' }, { id: 'pet5' }
    ]));
    context.resetState();
    assert.strictEqual(context.state.realPracticeMode, true, 'realPracticeMode should be true for 5 pets');
  });

  test('3. Manual toggle overrides realPracticeMode', () => {
    const env = setupTestEnvironment();
    const { context, domElements } = env;

    // Manual toggle on via DOM when album is empty
    context.localStorage.clear();
    domElements.chkRealPractice.checked = true;
    context.resetState();
    assert.strictEqual(context.state.realPracticeMode, true, 'DOM checkbox toggle should enable realPracticeMode even with 0 pets');

    // Manual toggle via options
    context.resetState(false, null, { realPracticeMode: false });
    assert.strictEqual(context.state.realPracticeMode, false, 'options.realPracticeMode: false should override');

    context.resetState(false, null, { realPracticeMode: true });
    assert.strictEqual(context.state.realPracticeMode, true, 'options.realPracticeMode: true should enable mode');

    // Dynamic toggleRealPracticeMode
    if (typeof context.toggleRealPracticeMode === 'function') {
      context.toggleRealPracticeMode(false);
      assert.strictEqual(context.state.realPracticeMode, false, 'toggleRealPracticeMode(false) should disable mode');
      context.toggleRealPracticeMode(true);
      assert.strictEqual(context.state.realPracticeMode, true, 'toggleRealPracticeMode(true) should enable mode');
    }
  });

  test('4. State initialization includes all lock and tracking structures', () => {
    const env = setupTestEnvironment();
    const { context } = env;
    context.resetState();

    assert.strictEqual(context.state.householdEnergyLock, 0, 'householdEnergyLock should initialize to 0');
    assert.strictEqual(Array.isArray(context.state.tempEnergyLocks), true, 'tempEnergyLocks should be array');
    assert.strictEqual(context.state.tempEnergyLocks.length, 0, 'tempEnergyLocks should be empty');
    assert.strictEqual(Array.isArray(context.state.pendingMentalEvents), true, 'pendingMentalEvents should be array');
    assert.strictEqual(context.state.pendingMentalEvents.length, 0, 'pendingMentalEvents should be empty');
    assert.strictEqual(Array.isArray(context.state.dailyMentalDrains), true, 'dailyMentalDrains should be array');
    assert.strictEqual(context.state.dailyMentalDrains.length, 0, 'dailyMentalDrains should be empty');
  });

  test('5. calcDailyEnergyReserve deducts householdEnergyLock and active tempEnergyLocks', () => {
    const env = setupTestEnvironment();
    const { context } = env;
    context.resetState();

    assert.strictEqual(typeof context.calcDailyEnergyReserve, 'function', 'calcDailyEnergyReserve must be a function');

    // Base = 32
    const baseEnergy = 32;
    assert.strictEqual(context.calcDailyEnergyReserve(baseEnergy), 32, 'No locks -> returns base');

    // Apply household lock of 10
    context.state.householdEnergyLock = 10;
    assert.strictEqual(context.calcDailyEnergyReserve(baseEnergy), 22, 'householdLock 10 -> returns 22');

    // Add temp energy lock of 5
    context.state.tempEnergyLocks = [
      { id: 'sos_chat', amount: 5, daysRemaining: 3, label: 'Помощь чату' }
    ];
    assert.strictEqual(context.calcDailyEnergyReserve(baseEnergy), 17, '32 - 10 - 5 = 17');

    // Expired temp lock (daysRemaining: 0) should not be deducted
    context.state.tempEnergyLocks.push(
      { id: 'expired_lock', amount: 8, daysRemaining: 0, label: 'Истекший блок' }
    );
    assert.strictEqual(context.calcDailyEnergyReserve(baseEnergy), 17, 'Expired locks (0 days) should not deduct');

    // Heavy locks should never drop below 0
    context.state.householdEnergyLock = 50;
    assert.strictEqual(context.calcDailyEnergyReserve(baseEnergy), 0, 'Reserve should never drop below 0');
  });

  test('6. ensureStateBackwardCompatibility ensures new properties exist', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    const legacyState = {
      day: 5,
      cash: 300,
      mental: 80,
      energy: 70
    };

    const updated = context.ensureStateBackwardCompatibility(legacyState);
    assert.strictEqual(updated.realPracticeMode, false);
    assert.strictEqual(updated.householdEnergyLock, 0);
    assert.strictEqual(Array.isArray(updated.tempEnergyLocks) && updated.tempEnergyLocks.length === 0, true);
    assert.strictEqual(Array.isArray(updated.pendingMentalEvents) && updated.pendingMentalEvents.length === 0, true);
    assert.strictEqual(Array.isArray(updated.dailyMentalDrains) && updated.dailyMentalDrains.length === 0, true);
  });

  test('7. Header difficulty badge reflects realPracticeMode', () => {
    const env = setupTestEnvironment();
    const { context, domElements } = env;

    context.resetState(false, null, { realPracticeMode: true });
    assert.strictEqual(domElements.realPracticeBadge.classList.contains('hidden'), false, 'Badge should be visible when realPracticeMode is true');
    assert.ok(domElements.realPracticeBadge.textContent.includes('Реальная практика'), 'Badge text should mention Реальная практика');

    context.resetState(false, null, { realPracticeMode: false });
    assert.strictEqual(domElements.realPracticeBadge.classList.contains('hidden'), true, 'Badge should be hidden when realPracticeMode is false');
  });

  console.log(`\nALL ${passed}/${total} TESTS PASSED!`);
}

runTests();
