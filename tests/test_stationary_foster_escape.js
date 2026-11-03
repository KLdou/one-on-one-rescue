// Test to verify that an animal in stationary (e.g. with panleukopenia in ICU)
// cannot trigger foster escape events and foster elapsed days do not increment in clinic.

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
    'animalAvatar', 'animalNameBadge', 'animalBreedBadge', 'animalSummaryText', 'animalTagsList',
    'checklistTags', 'checklistHintText', 'curatorLogs', 'deadlinesRadarList', 'activeCallsBadge',
    'cardActionsContainer', 'currentDateDisplay', 'currentSeasonDisplay', 'btnPause', 'btnSpeed1',
    'btnSpeed2', 'btnSpeed5', 'albumCountBtn', 'albumCountBadge', 'topOnboardingBanner',
    'bannerStepNumber', 'bannerMainText', 'bannerGoalSummary', 'btnNextStepAction', 'btnToggleOnboarding',
    'tab1Badge', 'tab2Badge', 'tab3Badge', 'fastForwardBtn', 'cardActionNotice', 'personalLimitProgress',
    'personalLimitText', 'voucherLimitProgress', 'voucherLimitText', 'fundraiserNotice', 'animalStatusTags',
    'prProgressText', 'animalChecklistTags', 'escapeDaysLeftTag', 'escapeProgressTag', 'escapeBanner',
    'escapeUrgentBanner', 'fosterStatusBadge', 'dailyExpenseLabel', 'eventModal', 'eventModalTitle',
    'eventModalText', 'eventModalButtons', 'storiesModal', 'storiesContainer', 'storiesCloseBtn',
    'albumModal', 'albumGrid', 'albumStatsText', 'debriefModal', 'debriefTitle', 'debriefDescription',
    'debriefMistakeAdvice', 'debriefRealStory', 'debriefRestartBtn'
  ];

  ids.forEach(id => {
    domElements[id] = mockElement(id);
  });

  let lastEventModal = null;

  const sandbox = {
    window: {
      GAME_DATA: null,
      onload: null
    },
    document: {
      getElementById: (id) => domElements[id] || mockElement(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: (tag) => mockElement(tag),
      body: mockElement('body'),
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    setTimeout: (fn) => fn(),
    setInterval: () => 123,
    clearInterval: () => {},
    console: console,
    Math: Math
  };

  vm.createContext(sandbox);

  for (const f of codeFiles) {
    const code = fs.readFileSync(f, 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }

  // Intercept showEventModal
  const origShowEventModal = sandbox.showEventModal;
  sandbox.showEventModal = function(title, desc, buttons) {
    lastEventModal = { title, desc, buttons };
    if (origShowEventModal) origShowEventModal(title, desc, buttons);
  };
  sandbox.getLastEventModal = () => lastEventModal;
  sandbox.clearLastEventModal = () => { lastEventModal = null; };

  return sandbox;
}

// TEST 1: If kitten is in stationary (panleukopenia in ICU), window escape on day 7 must NEVER fire
function testStationaryPreventsWindowEscape() {
  const env = setupTestEnvironment();
  // Initialize game
  env.startNewRun(false);
  const state = env.state;

  // Set up kitten with panleukopenia scenario
  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    ageDays: 45,
    ageCategory: 'kitten',
    count: 1,
    activeCount: 1,
    health: 45,
    inStationaryDaysLeft: 3,
    stationaryReason: 'virus',
    knownVirus: 'В инфекционном ОРИТ (капельницы)',
    hiddenState: {
      deadlyVirus: 'panleukopenia'
    }
  };

  // Simulate kitten was on novice foster before ICU
  state.zooshans.locationStatus = 'social_foster_novice';
  state.zooshans.socialFosterDaysElapsed = 7;
  state.triggeredEvents.windowEscape = false;
  state.escapeQuest = { active: false, daysRemaining: 0, searchProgress: 0 };

  env.clearLastEventModal();

  // Trigger checkMedicalAndCrisisTriggers
  const triggered = env.checkMedicalAndCrisisTriggers();

  console.log('Test 1 checkMedicalAndCrisisTriggers returned:', triggered);
  console.log('Last event modal:', env.getLastEventModal());
  console.log('Escape quest active:', state.escapeQuest.active);

  // Assert escape did NOT trigger
  assert.strictEqual(state.escapeQuest.active, false, 'Escape quest must NOT activate while animal is in stationary!');
  assert.strictEqual(state.triggeredEvents.windowEscape, false, 'Window escape must NOT be marked triggered while in stationary!');
  if (env.getLastEventModal()) {
    assert.ok(!env.getLastEventModal().title.includes('ЧП НА ПЕРЕДЕРЖКЕ'), 'Foster escape modal must NOT show while in stationary!');
  }
}

// TEST 2: While in stationary, socialFosterDaysElapsed must NOT increment
function testStationaryDoesNotIncrementFosterDays() {
  const env = setupTestEnvironment();
  env.startNewRun(false);
  const state = env.state;
  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    count: 1,
    activeCount: 1,
    health: 45,
    inStationaryDaysLeft: 2,
    stationaryReason: 'virus',
    knownVirus: 'В инфекционном ОРИТ',
    hiddenState: {}
  };

  state.zooshans.locationStatus = 'social_foster_novice';
  state.zooshans.socialFosterDaysElapsed = 3;

  // Run processDayTick directly
  env.processDayTick();

  // In stationary, the days on foster should not have incremented to 4
  console.log('Social foster days elapsed after tick:', state.zooshans.socialFosterDaysElapsed);
  assert.strictEqual(state.zooshans.socialFosterDaysElapsed, 3, 'Foster days must not increment while animal is in stationary!');
}

// TEST 3: When panleukopenia triggers and animal is sent to ICU from novice foster,
// the novice foster agreement is terminated because she cannot handle a dying/infectious kitten.
function testHospitalizationTerminatesNoviceFoster() {
  const env = setupTestEnvironment();
  env.startNewRun(false);
  const state = env.state;

  state.day = 4;
  state.cash = 600;
  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    count: 1,
    activeCount: 1,
    health: 60,
    inStationaryDaysLeft: 0,
    hiddenState: {
      deadlyVirus: 'panleukopenia',
      virusIncubationDays: 4
    }
  };
  state.zooshans.locationStatus = 'social_foster_novice';
  state.zooshans.socialFosterDaysElapsed = 3;

  env.clearLastEventModal();
  env.checkMedicalAndCrisisTriggers();

  const modal = env.getLastEventModal();
  assert.ok(modal, 'Virus modal must show');
  assert.ok(modal.title.includes('Панлейкопения') || modal.title.includes('чумка'), 'Title must mention panleukopenia');

  // Click primary button: "Согласовать с Колл-центром и поместить в инфекционный ОРИТ на 3 суток"
  const icuBtn = modal.buttons.find(b => b.style === 'primary');
  assert.ok(icuBtn, 'ICU button must exist');
  icuBtn.action();

  assert.strictEqual(state.animal.inStationaryDaysLeft, 3, 'Animal must be in stationary for 3 days');
  assert.strictEqual(state.animal.stationaryReason, 'virus', 'Reason must be virus');
  assert.notStrictEqual(state.zooshans.locationStatus, 'social_foster_novice', 'Novice foster must be ended upon ICU admission!');
}

// TEST 4: Self-healing: If an invalid foster escape quest is active while in stationary,
// calling checkMedicalAndCrisisTriggers or renderAll cleans up the bogus escape quest.
function testSelfHealingBogusEscapeQuest() {
  const env = setupTestEnvironment();
  env.startNewRun(false);
  const state = env.state;

  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    count: 1,
    activeCount: 1,
    health: 45,
    inStationaryDaysLeft: 3,
    stationaryReason: 'virus',
    hiddenState: {
      deadlyVirus: 'panleukopenia'
    }
  };
  state.zooshans.locationStatus = 'social_foster_novice';
  state.escapeQuest = {
    active: true,
    daysRemaining: 4,
    searchProgress: 0,
    reason: 'Побег из открытого окна на передержке'
  };
  state.triggeredEvents.windowEscape = true;

  // Run renderAll / checkMedicalAndCrisisTriggers
  env.renderAll();

  assert.strictEqual(state.escapeQuest.active, false, 'Bogus escape quest must be automatically deactivated');
}

console.log('Running tests...');
try {
  testStationaryPreventsWindowEscape();
  console.log('Test 1 passed!');
} catch (e) {
  console.error('Test 1 FAILED:', e.message);
}

try {
  testStationaryDoesNotIncrementFosterDays();
  console.log('Test 2 passed!');
} catch (e) {
  console.error('Test 2 FAILED:', e.message);
}

try {
  testHospitalizationTerminatesNoviceFoster();
  console.log('Test 3 passed!');
} catch (e) {
  console.error('Test 3 FAILED:', e.message);
}

try {
  testSelfHealingBogusEscapeQuest();
  console.log('Test 4 passed!');
} catch (e) {
  console.error('Test 4 FAILED:', e.message);
}

