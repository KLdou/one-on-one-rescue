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
    'animalModal', 'mentorModal', 'mentorArchiveModal', 'candidateInterviewModal'
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
  console.log('--- TEST SUITE: Mid-Game Crises (Days 5–20) Anti-FastForward Engine ---');
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

  test('1. MIDGAME_CRISES array exists and contains all 4 crisis specs', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    assert(Array.isArray(context.MIDGAME_CRISES), 'MIDGAME_CRISES should be an array');
    assert.strictEqual(context.MIDGAME_CRISES.length, 4, 'Should contain exactly 4 midgame crises');

    const ids = context.MIDGAME_CRISES.map(c => c.id);
    assert(ids.includes('crisis_incubation_ringworm'), 'Should have crisis_incubation_ringworm');
    assert(ids.includes('crisis_adaptation_rebellion'), 'Should have crisis_adaptation_rebellion');
    assert(ids.includes('crisis_foster_ultimatum'), 'Should have crisis_foster_ultimatum');
    assert(ids.includes('crisis_zooshans_chat_sos'), 'Should have crisis_zooshans_chat_sos');
  });

  test('2. crisis_incubation_ringworm: triggers on days 6-10 for stable cats, choice A and choice B work', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.day = 7;
    context.state.animal.species = 'cat';
    context.state.animal.fipTreatment = false;
    context.state.animal.traumaOperated = false;
    context.state.animal.hiddenState.hasSevereTrauma = false;
    context.state.animal.knownRingworm = false;

    const crisis = context.MIDGAME_CRISES.find(c => c.id === 'crisis_incubation_ringworm');
    assert(crisis, 'Crisis 1 exists');
    assert.strictEqual(crisis.condition(context.state), true, 'Condition should match for stable cat on day 7');

    // Trauma cat should not trigger
    context.state.animal.hiddenState.hasSevereTrauma = true;
    assert.strictEqual(crisis.condition(context.state), false, 'Condition should be false for severe trauma');
    context.state.animal.hiddenState.hasSevereTrauma = false;

    // Test Choice A
    context.state.cash = 100;
    context.state.personalMoneySpent = 0;
    context.state.energy = 50;
    context.state.mental = 60;
    context.state.animal.health = 80;
    context.state.pr.feedProgress = 15;
    context.state.pr.views = 200;
    context.currentSpeed = 5;

    context.triggerMidgameCrisisModal(crisis);
    assert.strictEqual(context.currentSpeed, 0, 'stopTimer() must pause game on trigger');

    crisis.choiceA.action(context.state);
    assert.strictEqual(context.state.cash, 55, 'Choice A should deduct 45 BYN');
    assert.strictEqual(context.state.personalMoneySpent, 45, 'Choice A should add 45 to personalMoneySpent');
    assert.strictEqual(context.state.energy, 25, 'Choice A should deduct 25 energy');
    assert.strictEqual(context.state.mental, 45, 'Choice A should deduct 15 mental');
    assert.strictEqual(context.state.animal.health, 75, 'Choice A should deduct 5 health');
    assert.strictEqual(context.state.pr.feedProgress, 0, 'Choice A should reset PR feedProgress');
    assert.strictEqual(context.state.pr.views, 0, 'Choice A should reset PR views');
    assert(
      (context.state.animal.vaccinationDelayDays >= 14) || (context.state.animal.vaccineDelayDays >= 14),
      'Choice A should delay vaccination 14 days'
    );

    // Test Choice B
    context.state.cash = 100;
    context.state.personalMoneySpent = 0;
    context.state.energy = 50;
    context.state.mental = 60;
    context.state.animal.health = 80;
    context.state.pendingMentalEvents = [];

    crisis.choiceB.action(context.state);
    assert.strictEqual(context.state.cash, 90, 'Choice B should deduct 10 BYN');
    assert.strictEqual(context.state.personalMoneySpent, 10, 'Choice B should add 10 to personalMoneySpent');
    assert.strictEqual(context.state.energy, 40, 'Choice B should deduct 10 energy');
    assert.strictEqual(context.state.mental, 55, 'Choice B should deduct 5 mental');
    assert.strictEqual(context.state.animal.health, 65, 'Choice B should deduct 15 health');
    assert(
      (context.state.animal.vaccinationDelayDays >= 21) || (context.state.animal.vaccineDelayDays >= 21),
      'Choice B should delay vaccination 21 days'
    );
    assert.strictEqual(context.state.pendingMentalEvents.length, 1, 'Choice B should queue pendingMentalEvent');
    assert.strictEqual(context.state.pendingMentalEvents[0].amount, -20, 'Pending mental event should be -20');
    assert.strictEqual(context.state.pendingMentalEvents[0].day, 11, 'Pending mental event should be scheduled for day + 4');
  });

  test('3. crisis_adaptation_rebellion: triggers on days 8-14, choice A and choice B work', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.day = 9;
    context.state.zooshans.locationStatus = 'home_floor';

    const crisis = context.MIDGAME_CRISES.find(c => c.id === 'crisis_adaptation_rebellion');
    assert(crisis, 'Crisis 2 exists');
    assert.strictEqual(crisis.condition(context.state), true, 'Condition should match for home_floor');

    context.state.zooshans.locationStatus = 'paid_foster';
    assert.strictEqual(crisis.condition(context.state), true, 'Condition should match for paid_foster');

    // Test Choice A: 40 BYN, 30⚡, 0🧠, mental +5
    context.state.cash = 100;
    context.state.personalMoneySpent = 0;
    context.state.energy = 60;
    context.state.mental = 70;

    crisis.choiceA.action(context.state);
    assert.strictEqual(context.state.cash, 60, 'Choice A should deduct 40 BYN');
    assert.strictEqual(context.state.personalMoneySpent, 40, 'Choice A should add 40 to personalMoneySpent');
    assert.strictEqual(context.state.energy, 30, 'Choice A should deduct 30 energy');
    assert.strictEqual(context.state.mental, 75, 'Choice A should boost mental +5');

    // Test Choice B: 0 BYN, 15⚡, 25🧠, dailyMentalDrain: 8 for 4 days
    context.state.cash = 100;
    context.state.energy = 50;
    context.state.mental = 60;
    context.state.dailyMentalDrains = [];

    crisis.choiceB.action(context.state);
    assert.strictEqual(context.state.cash, 100, 'Choice B should not deduct cash');
    assert.strictEqual(context.state.energy, 35, 'Choice B should deduct 15 energy');
    assert.strictEqual(context.state.mental, 35, 'Choice B should deduct 25 mental');
    assert.strictEqual(context.state.dailyMentalDrains.length, 1, 'Choice B should queue dailyMentalDrains');
    assert.strictEqual(context.state.dailyMentalDrains[0].amount, 8, 'Drain amount should be 8');
    assert.strictEqual(context.state.dailyMentalDrains[0].daysRemaining, 4, 'Drain daysRemaining should be 4');
  });

  test('4. crisis_foster_ultimatum: triggers on days 10-18, choice A and choice B work', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.day = 12;
    context.state.zooshans.locationStatus = 'paid_foster';

    const crisis = context.MIDGAME_CRISES.find(c => c.id === 'crisis_foster_ultimatum');
    assert(crisis, 'Crisis 3 exists');
    assert.strictEqual(crisis.condition(context.state), true, 'Condition should match on foster');

    // Test Choice A: 65 BYN, 20⚡, 10🧠
    context.state.cash = 100;
    context.state.personalMoneySpent = 0;
    context.state.energy = 50;
    context.state.mental = 60;

    crisis.choiceA.action(context.state);
    assert.strictEqual(context.state.cash, 35, 'Choice A should deduct 65 BYN');
    assert.strictEqual(context.state.personalMoneySpent, 65, 'Choice A should add 65 to personalMoneySpent');
    assert.strictEqual(context.state.energy, 30, 'Choice A should deduct 20 energy');
    assert.strictEqual(context.state.mental, 50, 'Choice A should deduct 10 mental');

    // Test Choice B: 0 BYN, 35⚡, 20🧠, locks household energy 15
    context.state.cash = 100;
    context.state.energy = 60;
    context.state.mental = 60;
    context.state.householdEnergyLock = 0;

    crisis.choiceB.action(context.state);
    assert.strictEqual(context.state.cash, 100, 'Choice B should not deduct cash');
    assert.strictEqual(context.state.energy, 25, 'Choice B should deduct 35 energy');
    assert.strictEqual(context.state.mental, 40, 'Choice B should deduct 20 mental');
    assert.strictEqual(context.state.householdEnergyLock, 15, 'Choice B should set householdEnergyLock to 15');
  });

  test('5. crisis_zooshans_chat_sos: triggers on days 12-16, choice A and choice B work', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.day = 14;

    const crisis = context.MIDGAME_CRISES.find(c => c.id === 'crisis_zooshans_chat_sos');
    assert(crisis, 'Crisis 4 exists');
    assert.strictEqual(crisis.condition(context.state), true, 'Condition should match any state');

    // Test Choice A: 25 BYN, 25⚡, 0🧠, tempEnergyLock 15 for 4 days, pendingMentalEvent +25 on day + 4
    context.state.cash = 100;
    context.state.personalMoneySpent = 0;
    context.state.energy = 50;
    context.state.mental = 60;
    context.state.tempEnergyLocks = [];
    context.state.pendingMentalEvents = [];

    crisis.choiceA.action(context.state);
    assert.strictEqual(context.state.cash, 75, 'Choice A should deduct 25 BYN');
    assert.strictEqual(context.state.personalMoneySpent, 25, 'Choice A should add 25 to personalMoneySpent');
    assert.strictEqual(context.state.energy, 25, 'Choice A should deduct 25 energy');
    assert.strictEqual(context.state.mental, 60, 'Choice A should not deduct mental');
    assert.strictEqual(context.state.tempEnergyLocks.length, 1, 'Choice A should queue tempEnergyLock');
    assert.strictEqual(context.state.tempEnergyLocks[0].amount, 15, 'Lock amount should be 15');
    assert.strictEqual(context.state.tempEnergyLocks[0].daysRemaining, 4, 'Lock duration should be 4 days');
    assert.strictEqual(context.state.pendingMentalEvents.length, 1, 'Choice A should queue pendingMentalEvent');
    assert.strictEqual(context.state.pendingMentalEvents[0].amount, 25, 'Mental reward should be +25');
    assert.strictEqual(context.state.pendingMentalEvents[0].day, 18, 'Mental reward should be on day 18');

    // Test Choice B: 0 BYN, 5⚡, 18🧠
    context.state.cash = 100;
    context.state.energy = 50;
    context.state.mental = 60;

    crisis.choiceB.action(context.state);
    assert.strictEqual(context.state.cash, 100, 'Choice B should not deduct cash');
    assert.strictEqual(context.state.energy, 45, 'Choice B should deduct 5 energy');
    assert.strictEqual(context.state.mental, 42, 'Choice B should deduct 18 mental');
  });

  test('6. engine.js:processDayTick() ticks dailyMentalDrains, tempEnergyLocks, and pendingMentalEvents', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.day = 10;
    context.state.mental = 70;
    context.state.supplies.daysLeft = 10;
    context.state.onboarding.acutePhase = false;

    // Set up active drain, temp lock, pending mental
    context.state.dailyMentalDrains = [{ id: 'test_drain', amount: 8, daysRemaining: 2, label: 'Стресс' }];
    context.state.tempEnergyLocks = [{ id: 'test_lock', amount: 15, daysRemaining: 2, label: 'Карантин' }];
    context.state.pendingMentalEvents = [{ day: 11, amount: 20, label: 'Облегчение' }];

    // Prevent midgame crisis from interrupting this tick by marking them already triggered
    context.state.triggeredEvents.crisis_incubation_ringworm = true;
    context.state.triggeredEvents.crisis_adaptation_rebellion = true;
    context.state.triggeredEvents.crisis_foster_ultimatum = true;
    context.state.triggeredEvents.crisis_zooshans_chat_sos = true;

    // Process 1 day tick -> day becomes 11
    context.processDayTick();

    assert.strictEqual(context.state.day, 11, 'Day should advance to 11');
    assert.strictEqual(context.state.dailyMentalDrains[0].daysRemaining, 1, 'Drain daysRemaining should decrement to 1');
    assert.strictEqual(context.state.tempEnergyLocks[0].daysRemaining, 1, 'Temp lock daysRemaining should decrement to 1');
    assert.strictEqual(context.state.pendingMentalEvents.length, 0, 'Pending mental event for day 11 should have triggered and cleared');

    // Process another day tick -> day becomes 12 (drain & lock reach 0 and get cleared)
    context.processDayTick();
    assert.strictEqual(context.state.day, 12, 'Day should advance to 12');
    assert.strictEqual(context.state.dailyMentalDrains.length, 0, 'Drain should be cleared when daysRemaining reaches 0');
    assert.strictEqual(context.state.tempEnergyLocks.length, 0, 'Lock should be cleared when daysRemaining reaches 0');
  });

  test('7. engine.js: midgame crisis automatically pauses timer when triggered during processDayTick', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;
    context.state.onboarding.acutePhase = false;
    context.state.supplies.daysLeft = 10;
    context.state.day = 6; // Day 7 will trigger crisis_incubation_ringworm
    context.state.animal.species = 'cat';
    context.state.animal.fipTreatment = false;
    context.state.animal.traumaOperated = false;
    context.state.animal.hiddenState.hasSevereTrauma = false;
    context.state.animal.knownRingworm = false;
    context.currentSpeed = 5;

    context.processDayTick();

    assert.strictEqual(context.currentSpeed, 0, 'Game speed must be 0 (paused) upon midgame crisis trigger');
    assert.strictEqual(context.state.triggeredEvents.crisis_incubation_ringworm, true, 'crisis_incubation_ringworm should be marked as triggered');
  });

  test('8. engine.js: midgame crisis does NOT trigger if realPracticeMode is false', () => {
    const env = setupTestEnvironment();
    const { context } = env;

    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = false;
    context.state.onboarding.acutePhase = false;
    context.state.supplies.daysLeft = 10;
    context.state.day = 6;
    context.state.animal.species = 'cat';
    context.state.animal.fipTreatment = false;
    context.state.animal.traumaOperated = false;
    context.state.animal.hiddenState.hasSevereTrauma = false;
    context.state.animal.knownRingworm = false;
    context.currentSpeed = 5;

    context.processDayTick();

    assert.strictEqual(context.state.triggeredEvents.crisis_incubation_ringworm, undefined, 'Crisis should NOT trigger when realPracticeMode is false');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
