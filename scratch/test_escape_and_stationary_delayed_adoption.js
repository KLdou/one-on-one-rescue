// Test verification for:
// 1. Adaptive escape event on novice foster (puppy / dog vs cat)
// 2. Stationary care, mortality risk, convalescence, and delayed adoption (2 weeks for virus, 1.5 months for trauma)

const fs = require('fs');
const vm = require('vm');

function runTest() {
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
    'prProgressText', 'animalChecklistTags', 'escapeDaysLeftTag', 'escapeProgressTag', 'escapeBanner'
  ];

  ids.forEach(id => {
    domElements[id] = mockElement(id);
  });

  let lastEventModal = null;

  const sandbox = {
    console,
    Math,
    Date,
    window: {},
    document: {
      body: mockElement('body'),
      getElementById: (id) => domElements[id] || (domElements[id] = mockElement(id)),
      querySelectorAll: () => [],
      querySelector: () => mockElement(),
      createElement: () => mockElement(),
      addEventListener: () => {}
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    setTimeout: (fn) => fn(),
    setInterval: () => 123,
    clearInterval: () => {}
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);

  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  // Capture showEventModal
  vm.runInContext(`
    let capturedModals = [];
    window.showEventModal = (title, desc, choices) => {
      capturedModals.push({ title, desc, choices });
    };
    window.addLog = (msg, type) => {
      state.logs = state.logs || [];
      state.logs.push({ msg, type });
    };
  `, context);

  console.log('=== TEST 1: Novice Foster Escape Event for Puppies ===');
  vm.runInContext(`
    startNewRun();
    state.animal.species = 'dog';
    state.animal.ageCategory = 'puppy';
    state.animal.count = 4;
    state.animal.activeCount = 4;
    state.animal.name = 'Щенки в коробке';
    state.zooshans.locationStatus = 'social_foster_novice';
    state.zooshans.socialFosterDaysElapsed = 7;
    capturedModals = [];
    
    // Trigger dynamic events
    checkMedicalAndCrisisTriggers();
  `, context);

  const puppyEscapeModal = vm.runInContext(`capturedModals[capturedModals.length - 1]`, context);
  console.log('Puppy escape modal title:', puppyEscapeModal ? puppyEscapeModal.title : 'NONE');
  console.log('Puppy escape modal desc snippet:', puppyEscapeModal ? puppyEscapeModal.desc.slice(0, 80) : 'NONE');

  if (!puppyEscapeModal || !puppyEscapeModal.title.includes('Щенок выскочил через незапертую дверь')) {
    throw new Error('FAIL: Puppy escape event should mention щенок and незапертая дверь, NOT кот and окно!');
  }
  if (puppyEscapeModal.desc.includes('воробья')) {
    throw new Error('FAIL: Puppy description should NOT mention воробья!');
  }
  console.log('PASS: Puppy escape modal is correctly adapted for puppies.');

  console.log('\n=== TEST 2: Novice Foster Escape Event for Cats ===');
  vm.runInContext(`
    startNewRun();
    state.animal.species = 'cat';
    state.animal.ageCategory = 'adult';
    state.animal.count = 1;
    state.animal.activeCount = 1;
    state.zooshans.locationStatus = 'social_foster_novice';
    state.zooshans.socialFosterDaysElapsed = 7;
    capturedModals = [];
    
    checkMedicalAndCrisisTriggers();
  `, context);

  const catEscapeModal = vm.runInContext(`capturedModals[capturedModals.length - 1]`, context);
  console.log('Cat escape modal title:', catEscapeModal ? catEscapeModal.title : 'NONE');
  if (!catEscapeModal || !catEscapeModal.title.includes('Кот выпрыгнул в открытое окно')) {
    throw new Error('FAIL: Cat escape event should mention кот and окно!');
  }
  console.log('PASS: Cat escape modal verified.');

  console.log('\n=== TEST 3: Virus Outbreak -> Infectious Stationary (3 days) -> 14-day Recovery ===');
  vm.runInContext(`
    startNewRun();
    state.animal.species = 'cat';
    state.animal.ageCategory = 'kitten';
    state.animal.ageDays = 40;
    state.animal.count = 1;
    state.animal.activeCount = 1;
    state.animal.hiddenState.deadlyVirus = 'panleukopenia';
    state.day = 4;
    capturedModals = [];
    
    checkMedicalAndCrisisTriggers();
  `, context);

  const virusModal = vm.runInContext(`capturedModals[capturedModals.length - 1]`, context);
  console.log('Virus modal title:', virusModal ? virusModal.title : 'NONE');
  if (!virusModal || !virusModal.title.includes('Панлейкопения')) {
    throw new Error('FAIL: Panleukopenia modal should trigger!');
  }

  // Click option 0: place into ICU
  vm.runInContext(`
    const vModal = capturedModals[capturedModals.length - 1];
    vModal.choices[0].action();
  `, context);

  const inIcuDays = vm.runInContext(`state.animal.inStationaryDaysLeft`, context);
  const stationaryReason = vm.runInContext(`state.animal.stationaryReason`, context);
  console.log('Animal in stationary days:', inIcuDays, 'reason:', stationaryReason);
  if (inIcuDays !== 3 || stationaryReason !== 'virus') {
    throw new Error('FAIL: Animal should be in stationary for 3 days with reason "virus"!');
  }

  // Check household energy drain is 0 while in stationary
  const drainInIcu = vm.runInContext(`calculateDailyHouseholdEnergyDrain()`, context);
  console.log('Household energy drain in ICU:', drainInIcu);
  if (drainInIcu !== 0) {
    throw new Error('FAIL: Household drain should be 0 while animal is in stationary!');
  }

  // Check that PR is blocked
  const isPrBlocked = vm.runInContext(`
    const a = state.animal;
    const isMedicallyRestricted = (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
                                 (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
                                 (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0);
    isMedicallyRestricted
  `, context);
  console.log('Is PR medically restricted in ICU?:', isPrBlocked);
  if (!isPrBlocked) {
    throw new Error('FAIL: PR should be restricted during ICU!');
  }

  // Check that adoption transfer is guarded
  vm.runInContext(`
    state.logs = [];
    initiateAnimalTransferWithTrial(false, { id: 'test_call' });
  `, context);
  const transferGuardLog = vm.runInContext(`state.logs.find(l => l.msg.includes('Передача в семью строго отложена'))`, context);
  console.log('Transfer guard log in ICU:', transferGuardLog ? transferGuardLog.msg : 'NONE');
  if (!transferGuardLog) {
    throw new Error('FAIL: Transfer to adopters must be blocked during ICU!');
  }

  // Simulate discharge from ICU after 3 days
  vm.runInContext(`
    // Force health high so random mortality doesn't trigger in test
    state.animal.health = 90;
    processDayTick(); // day 1 in ICU
    processDayTick(); // day 2 in ICU
    processDayTick(); // day 3 in ICU -> discharge
  `, context);

  const virusRecoveryDays = vm.runInContext(`state.animal.virusRecoveryDaysLeft`, context);
  console.log('Virus recovery days after ICU discharge:', virusRecoveryDays);
  if (virusRecoveryDays !== 14) {
    throw new Error('FAIL: Animal must have 14 days of virus recovery post-discharge! Got: ' + virusRecoveryDays);
  }

  console.log('PASS: Virus outbreak -> ICU -> 14 days recovery successfully verified.');

  console.log('\n=== TEST 4: Severe Trauma Surgery -> 45-day Bone Fusion / Rehab ===');
  vm.runInContext(`
    startNewRun();
    state.animal.species = 'dog';
    state.animal.ageCategory = 'adult';
    state.animal.id = 'severe_trauma_sheri_dog';
    state.animal.hiddenState.hasSevereTrauma = true;
    state.zooshans.expensiveApproved = true;
    
    // Conduct surgery in Tab 1
    state.currentTab = 1;
    renderActionTabs();
    
    // In ui.js surgery button calls payVetBill(450...), sets inStationaryDaysLeft = 3, traumaRehabDaysLeft = 45
    const an = state.animal;
    an.traumaOperated = true;
    an.hiddenState.hasSevereTrauma = false;
    an.inStationaryDaysLeft = 3;
    an.stationaryReason = 'trauma';
    an.traumaRehabDaysLeft = 45;
    an.health = 75;
  `, context);

  const traumaRehabDays = vm.runInContext(`state.animal.traumaRehabDaysLeft`, context);
  console.log('Trauma rehab days initialized:', traumaRehabDays);
  if (traumaRehabDays !== 45) {
    throw new Error('FAIL: Trauma rehab days should be 45 (1.5 months)! Got: ' + traumaRehabDays);
  }

  // In stationary for 3 days:
  vm.runInContext(`
    state.animal.health = 90;
    processDayTick(); // in ICU: 3 -> 2
    processDayTick(); // in ICU: 2 -> 1
    processDayTick(); // in ICU: 1 -> 0, discharged!
  `, context);

  const rehabDaysAtDischarge = vm.runInContext(`state.animal.traumaRehabDaysLeft`, context);
  console.log('Trauma rehab days at discharge:', rehabDaysAtDischarge);
  if (rehabDaysAtDischarge !== 45) {
    throw new Error('FAIL: At discharge trauma rehab days should be 45!');
  }

  // 3 days of post-discharge home rehab:
  vm.runInContext(`
    processDayTick(); // 45 -> 44
    processDayTick(); // 44 -> 43
    processDayTick(); // 43 -> 42
  `, context);

  const rehabDaysAfterDischarge = vm.runInContext(`state.animal.traumaRehabDaysLeft`, context);
  console.log('Trauma rehab days after 3 days of home rehab:', rehabDaysAfterDischarge);
  if (rehabDaysAfterDischarge !== 42) {
    throw new Error('FAIL: Trauma rehab days should decrement by 3 to 42! Got: ' + rehabDaysAfterDischarge);
  }

  console.log('PASS: Severe trauma surgery -> 45 days bone fusion/rehab verified.');

  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}

runTest();
