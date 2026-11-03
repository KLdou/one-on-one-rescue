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
    'debriefMistakeAdvice', 'debriefRealStory', 'debriefRestartBtn', 'giftBannerText'
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

  const origShowEventModal = sandbox.showEventModal;
  sandbox.showEventModal = function(title, desc, buttons) {
    lastEventModal = { title, desc, buttons };
    if (origShowEventModal) origShowEventModal(title, desc, buttons);
  };
  sandbox.getLastEventModal = () => lastEventModal;
  sandbox.clearLastEventModal = () => { lastEventModal = null; };

  return sandbox;
}

// TEST 1: Drop chance calculation scales with wait days
function testDropChanceScaling() {
  const env = setupTestEnvironment();
  assert.strictEqual(typeof env.calculateEarlyBookingDropChance, 'function', 'calculateEarlyBookingDropChance must be defined');

  assert.strictEqual(env.calculateEarlyBookingDropChance(1), 0.10);
  assert.strictEqual(env.calculateEarlyBookingDropChance(3), 0.10);
  assert.strictEqual(env.calculateEarlyBookingDropChance(5), 0.18);
  assert.strictEqual(env.calculateEarlyBookingDropChance(7), 0.18);
  assert.strictEqual(env.calculateEarlyBookingDropChance(10), 0.25);
  assert.strictEqual(env.calculateEarlyBookingDropChance(14), 0.25);
  assert.strictEqual(env.calculateEarlyBookingDropChance(20), 0.35);
  assert.strictEqual(env.calculateEarlyBookingDropChance(25), 0.35);
  assert.strictEqual(env.calculateEarlyBookingDropChance(35), 0.45);
}

// TEST 2: Storytelling booking while pet is sick does not force immediate handover
function testStorytellingBookingWhileSick() {
  const env = setupTestEnvironment();
  env.startNewRun(false);
  const state = env.state;

  state.day = 5;
  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    count: 1,
    activeCount: 1,
    health: 50,
    inStationaryDaysLeft: 2,
    stationaryReason: 'virus',
    hiddenState: {}
  };
  state.energy = 50;

  // Force Math.random to hit the 12% branch in storytelling
  const origRandom = env.Math.random;
  env.Math.random = () => 0.05;

  env.clearLastEventModal();
  env.actionWriteStorytellingPost();

  env.Math.random = origRandom;

  const modal = env.getLastEventModal();
  assert.ok(modal, 'Storytelling booking modal must show');
  assert.ok(!modal.title.includes('Передача малыша в семью'), 'Sick pet must not receive immediate trial transfer modal');
  assert.ok(modal.title.includes('БРОНЬ') || modal.title.includes('Ранняя бронь') || modal.desc.includes('забронировал'), 'Modal must announce booking');

  assert.strictEqual(state.pr.earlyBooking.active, true, 'earlyBooking.active must be true');
  assert.strictEqual(state.pr.earlyBooking.bookedOnDay, 5, 'bookedOnDay must be recorded');
}

// TEST 3: Calling booked family after recovery - drop vs success outcomes
function testContactEarlyBookedAdopterOutcome() {
  const env = setupTestEnvironment();
  env.startNewRun(false);
  const state = env.state;

  state.day = 20; // 15 days wait
  state.mental = 80;
  state.animal = {
    id: 'ginger_viral_kitten',
    species: 'cat',
    name: 'Персик',
    count: 1,
    activeCount: 1,
    health: 90,
    inStationaryDaysLeft: 0,
    virusRecoveryDaysLeft: 0,
    traumaRehabDaysLeft: 0,
    knownRingworm: false,
    hiddenState: {}
  };
  state.pr.earlyBooking = {
    active: true,
    bookedOnDay: 5,
    candidateName: 'Семья Ивановых'
  };
  state.pr.earlyBookedAdopterWaiting = true;

  // Scenario A: Adopter backs out (random roll < dropChance = 0.35)
  let origRandom = env.Math.random;
  env.Math.random = () => 0.10; // < 0.35 -> Drop!

  env.clearLastEventModal();
  env.actionContactEarlyBookedAdopter();

  const dropModal = env.getLastEventModal();
  assert.ok(dropModal, 'Drop modal must show');
  assert.ok(dropModal.title.toLowerCase().includes('передумала') || dropModal.title.toLowerCase().includes('отказ'), 'Must be drop modal');
  assert.strictEqual(state.pr.earlyBooking.active, false, 'Booking must be cleared on drop');
  assert.strictEqual(state.pr.earlyBookedAdopterWaiting, false, 'Waiting flag must be cleared');
  assert.strictEqual(state.mental, 70, 'Curator mental must drop by 10 on cancellation');

  // Scenario B: Adopter confirms (random roll >= dropChance)
  state.pr.earlyBooking = {
    active: true,
    bookedOnDay: 15, // 5 days wait -> dropChance = 0.18
    candidateName: 'Семья Ивановых'
  };
  state.pr.earlyBookedAdopterWaiting = true;
  env.Math.random = () => 0.50; // >= 0.18 -> Success!

  env.clearLastEventModal();
  env.actionContactEarlyBookedAdopter();

  const successModal = env.getLastEventModal();
  assert.ok(successModal, 'Success transfer modal must show');
  assert.ok(successModal.title.includes('РАННЯЯ БРОНЬ') || successModal.title.includes('Передача'), 'Must be transfer modal');

  env.Math.random = origRandom;
}

console.log('Running Early Booking Recovery Tests...');
try {
  testDropChanceScaling();
  console.log('✓ Test 1: Drop chance scaling passed');
} catch (e) {
  console.error('✗ Test 1 FAILED:', e.message);
}

try {
  testStorytellingBookingWhileSick();
  console.log('✓ Test 2: Storytelling booking while sick passed');
} catch (e) {
  console.error('✗ Test 2 FAILED:', e.message);
}

try {
  testContactEarlyBookedAdopterOutcome();
  console.log('✓ Test 3: Contact booked adopter outcomes passed');
} catch (e) {
  console.error('✗ Test 3 FAILED:', e.message);
}
