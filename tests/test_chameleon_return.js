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
    'chkRealPracticeMobile', 'eventOverlayBox', 'actionsDashboard', 'extraQuestionBox', 'mobileTimeDock',
    'eventBadge', 'eventTitle', 'eventBody', 'eventChoicesContainer', 'savedAlbumModal', 'scenarioPickerModal',
    'animalModal', 'mentorModal', 'mentorArchiveModal', 'candidateInterviewModal',
    'candidateBadge', 'candidateSourceTag', 'candidateNameHousing', 'candidateDialogueText',
    'candidateSlot1Box', 'candidateSlot1Text', 'candidateSlot1Flag',
    'candidateSlot2Box', 'candidateSlot2Text', 'candidateSlot2Flag', 'slot2ClosedView', 'slot2OpenView',
    'candidateSlot3Box', 'candidateSlot3Text', 'candidateSlot3Flag', 'slot3ClosedView', 'slot3OpenView',
    'candidatePhotoCheckResultBox', 'candidateActionButtons'
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

function initGameForTest(context) {
  if (typeof context.resetState === 'function') {
    context.resetState();
  }
  context.state.gameOver = false;
  context.state.realPracticeMode = true;
  context.state.day = 1;
  context.state.cash = 200;
  context.state.personalMoneySpent = 50;
  context.state.mental = 80;
  context.state.energy = 50;
  if (!context.state.supplies) {
    context.state.supplies = { daysLeft: 14, lastWarningDay: -1 };
  } else {
    context.state.supplies.daysLeft = 14;
  }
  context.state.animal = {
    id: 'cat_injured',
    title: 'Травмированный кот',
    species: 'cat',
    health: 90,
    count: 1,
    activeCount: 1,
    initialCount: 1,
    trialCount: 0,
    savedCount: 0,
    petName: 'Барсик',
    isAcutePhase: false,
    hiddenState: {
      needsSocialization: false,
      socializationDaysDone: 0
    }
  };
  if (!context.state.zooshans) {
    context.state.zooshans = {};
  }
  if (!context.state.player) {
    context.state.player = { family: { mentalBonus: 0 }, housing: { dailyMentalDrain: 0 } };
  } else {
    if (context.state.player.family) context.state.player.family.mentalBonus = 0;
    if (context.state.player.housing) context.state.player.housing.dailyMentalDrain = 0;
  }
  context.state.zooshans.locationStatus = 'home_floor';
  context.state.trialAnimals = [];
  context.state.pr = {
    feedProgress: 5,
    views: 120,
    storytellingBoost: 0.5
  };
}

function runTests() {
  console.log('--- TEST SUITE: Chameleon False Final & Delayed Trial Return on Day 3-4 ---');
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
      console.error(err);
    }
  }

  test('Chameleon candidate with hidden red flag transfers to trial without instant game over', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0])); // cham_sliding_balcony_risk, daysUntilReturn: 3
    assert.strictEqual(candidate.isChameleon, true);
    assert.strictEqual(candidate.hasHiddenRedFlag, true);
    assert.strictEqual(!candidate.photoChecked, true);

    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;

    context.actionAcceptCandidate(false, { isRedFlag: true });

    assert.strictEqual(context.state.gameOver, false, 'Should not game over immediately');
    assert.strictEqual(context.state.trialAnimals.length, 1, 'Animal should be in trial');
    const trial = context.state.trialAnimals[0];
    assert.strictEqual(trial.isChameleonReturn, true, 'isChameleonReturn should be true');
    assert.strictEqual(trial.isRedFlag, false, 'isRedFlag must be false to avoid generic fatal strike');
    assert.strictEqual(trial.targetDays, 3, 'targetDays should match returnEvent daysUntilReturn (3)');
    assert.deepStrictEqual(trial.returnEvent, candidate.returnEvent);
    assert.strictEqual(context.state.animal.activeCount, 0, 'Active count decreased');
    assert.strictEqual(context.state.animal.trialCount, 1, 'Trial count increased');
  });

  test('Days 1 and 2 do not trigger return prematurely', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;
    context.actionAcceptCandidate(false);

    let modalTriggered = false;
    context.triggerChameleonReturnModal = () => { modalTriggered = true; };

    // Advance to day 2 (trial daysPassed: 1)
    context.processDayTick();
    assert.strictEqual(modalTriggered, false, 'Should not trigger on day 1 of trial');
    assert.strictEqual(context.state.trialAnimals.length, 1);
    assert.strictEqual(context.state.trialAnimals[0].daysPassed, 1);

    // Advance to day 3 (trial daysPassed: 2)
    context.processDayTick();
    assert.strictEqual(modalTriggered, false, 'Should not trigger on day 2 of trial');
    assert.strictEqual(context.state.trialAnimals.length, 1);
    assert.strictEqual(context.state.trialAnimals[0].daysPassed, 2);
  });

  test('Day 3 triggers delayed return with penalties: health, mental, vet bill, PR reset, pet returned', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0])); // daysUntilReturn: 3, petHealthDelta: -25, curatorMentalDelta: -35, vetBillByn: 90
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;
    context.actionAcceptCandidate(false);

    let modalItem = null;
    let timerStopped = false;
    context.triggerChameleonReturnModal = (item) => { modalItem = item; };
    context.stopTimer = () => { timerStopped = true; };

    // Set trial animal to daysPassed: 2 (so next tick reaches 3 >= targetDays 3)
    context.state.trialAnimals[0].daysPassed = 2;

    const cashBefore = context.state.cash; // 200
    const personalSpentBefore = context.state.personalMoneySpent; // 50
    const mentalBefore = context.state.mental; // 80
    const healthBefore = context.state.animal.health; // 90

    context.processDayTick();

    assert.ok(modalItem, 'triggerChameleonReturnModal should have been called');
    assert.strictEqual(context.state.trialAnimals.length, 0, 'Trial item should be spliced');
    assert.strictEqual(context.state.animal.activeCount, 1, 'Pet returned to curator active care');
    assert.strictEqual(context.state.animal.trialCount, 0, 'Trial count cleared');

    // Penalties check
    assert.strictEqual(context.state.animal.health, healthBefore - 25, 'Health decreased by 25');
    assert.strictEqual(context.state.mental, mentalBefore - 35, 'Mental decreased by 35');
    assert.strictEqual(context.state.cash, cashBefore - 90, 'Vet bill 90 BYN deducted from cash');
    assert.strictEqual(context.state.personalMoneySpent, personalSpentBefore + 90, 'Personal money spent increased by 90 BYN');

    // PR progress reset
    assert.strictEqual(context.state.pr.feedProgress, 0, 'PR feed progress reset to 0');
    assert.strictEqual(context.state.pr.views, 0, 'PR views reset to 0');
    assert.strictEqual(context.state.pr.storytellingBoost, 0.3, 'PR storytellingBoost decreased by 0.2');

    assert.strictEqual(timerStopped, true, 'stopTimer() must be called');
    assert.strictEqual(context.state.gameOver, false, 'Should NOT be game over - curator continues');
  });

  test('Day 4 candidate (allergy, 0 vet bill) triggers on day 4 correctly', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[1])); // daysUntilReturn: 4, petHealthDelta: -15, curatorMentalDelta: -30, vetBillByn: 0
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;
    context.actionAcceptCandidate(false);

    const trial = context.state.trialAnimals[0];
    assert.strictEqual(trial.targetDays, 4, 'targetDays should be 4');

    let modalItem = null;
    context.triggerChameleonReturnModal = (item) => { modalItem = item; };

    trial.daysPassed = 2;
    context.processDayTick(); // day 3
    assert.strictEqual(modalItem, null, 'Should not trigger on day 3');
    assert.strictEqual(context.state.trialAnimals.length, 1);

    const cashBefore = context.state.cash;
    context.processDayTick(); // day 4
    assert.ok(modalItem, 'Should trigger on day 4');
    assert.strictEqual(context.state.trialAnimals.length, 0);
    assert.strictEqual(context.state.cash, cashBefore, '0 vet bill should not alter cash');
  });

  test('triggerChameleonReturnModal displays modal and writes educational chronicle log', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    let modalTitle = '';
    let modalDesc = '';
    let modalChoices = [];
    context.showEventModal = (title, desc, choices) => {
      modalTitle = title;
      modalDesc = desc;
      modalChoices = choices;
    };

    let timerStopped = false;
    context.stopTimer = () => { timerStopped = true; };

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    const fakeTrialItem = {
      petName: 'Барсик',
      count: 1,
      returnEvent: candidate.returnEvent
    };

    let loggedText = '';
    let loggedType = '';
    context.addLog = (text, type) => {
      loggedText = text;
      loggedType = type;
    };

    assert.strictEqual(typeof context.triggerChameleonReturnModal, 'function', 'triggerChameleonReturnModal must be a function in events.js');
    context.triggerChameleonReturnModal(fakeTrialItem);

    assert.strictEqual(timerStopped, true, 'stopTimer must be called');
    assert.strictEqual(modalTitle, candidate.returnEvent.title);
    assert.strictEqual(modalDesc, candidate.returnEvent.description);
    assert.ok(modalChoices.length > 0, 'Should have at least 1 choice');
    assert.ok(loggedText.includes('Урок куратора: проверка сеток-антикошек по фото'), 'Must contain educational warning');

    // Executing choice closes modal
    let modalClosed = false;
    context.closeEventModal = () => { modalClosed = true; };
    modalChoices[0].action();
    assert.strictEqual(modalClosed, true);
  });

  test('Photo check unmasks chameleon and blocks adoption transfer', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;

    assert.strictEqual(candidate.photoChecked, undefined);
    context.actionRequestPhotoCheck();

    assert.strictEqual(candidate.photoChecked, true);
    assert.strictEqual(candidate.unmasked, true);
    assert.strictEqual(candidate.blocked, true);

    // Attempting to accept blocked candidate
    context.actionAcceptCandidate(false);
    assert.strictEqual(context.state.trialAnimals.length, 0, 'Blocked candidate must not be transferred to trial');
    assert.strictEqual(context.state.animal.activeCount, 1, 'Pet remains with curator');
  });

  test('Penalties clamp properly: health min 10, mental min 0', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;
    context.actionAcceptCandidate(false);

    context.state.animal.health = 15; // with -25 delta should clamp to 10
    context.state.mental = 10;        // with -35 delta should clamp to 0
    context.state.trialAnimals[0].daysPassed = 2;

    context.processDayTick();

    assert.strictEqual(context.state.animal.health, 10, 'Health clamped to minimum 10');
    assert.strictEqual(context.state.mental, 0, 'Mental clamped to minimum 0');
  });

  test('Genuine safe chameleon candidate does not have isChameleonReturn set', () => {
    const { context } = setupTestEnvironment();
    initGameForTest(context);

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[2])); // cham_genuine_ideal_adopter, hasHiddenRedFlag: false
    context.currentCandidateCall = candidate;
    context.window.currentCandidateCall = candidate;
    context.actionAcceptCandidate(false);

    assert.strictEqual(context.state.trialAnimals.length, 1);
    const trial = context.state.trialAnimals[0];
    assert.strictEqual(trial.isChameleonReturn, false, 'Genuine candidate must not have isChameleonReturn');
    assert.strictEqual(trial.targetDays, 14, 'targetDays must be standard 14 days');
  });

  console.log(`\nResults: ${passed} / ${total} passed`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
