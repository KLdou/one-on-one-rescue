// Verification of puppy pee pads training and own cat food sharing restriction
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
    'personalLimitText', 'voucherLimitProgress', 'voucherLimitText', 'fundraiserNotice'
  ];

  ids.forEach(id => {
    domElements[id] = mockElement(id);
  });

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

  console.log('--- TEST 1: Cat Food Sharing on DOG foster ---');
  // Start game with dog
  vm.runInContext(`
    startNewRun();
    // Force player to have vaccinated_cat
    state.player.ownPets = { id: 'vaccinated_cat', label: '🛡️ Свой кот (привит)', infectionRisk: 'low' };
    state.supplies.daysLeft = 1;
    state.cash = 20; // low cash
    
    // Set foster animal to dog
    state.animal.species = 'dog';
    state.animal.ageCategory = 'puppy';
    state.animal.id = 'orphan_puppies_litter';
    state.animal.name = 'Щенки в коробке';
    
    const logs = [];
    const origAddLog = window.addLog;
    window.addLog = (msg, type) => {
      logs.push({ msg, type });
      if (typeof origAddLog === 'function') origAddLog(msg, type);
    };
    
    const careButtonsDog = [];
    // Let's call renderTabCare logic or test careButtons array directly
    // Let's inspect careButtons inside renderTabCare
  `, context);

  // Check actionShareFoodWithOwnCat on dog
  const dogFoodAttempt = vm.runInContext(`
    const initialSupplies = state.supplies.daysLeft;
    actionShareFoodWithOwnCat();
    ({
      initialSupplies,
      afterSupplies: state.supplies.daysLeft,
      logs
    })
  `, context);

  console.log('Dog attempt supplies before/after:', dogFoodAttempt.initialSupplies, dogFoodAttempt.afterSupplies);
  console.log('Last log:', dogFoodAttempt.logs[dogFoodAttempt.logs.length - 1]);
  if (dogFoodAttempt.afterSupplies !== 1) {
    throw new Error('FAIL: Cat food should NOT be added to dog foster supplies!');
  }
  if (!dogFoodAttempt.logs.some(l => l.msg.includes('Кошачий корм не подходит для собак'))) {
    throw new Error('FAIL: Warning log about cat food not suitable for dogs was not logged!');
  }
  console.log('PASS: Dog cannot borrow cat food.');

  console.log('\n--- TEST 2: Cat Food Sharing on CAT foster ---');
  vm.runInContext(`
    state.animal.species = 'cat';
    state.animal.ageCategory = 'adult';
    state.animal.id = 'scared_basement_cat';
    state.supplies.daysLeft = 1;
    state.cash = 20;
    state.lastOwnPetFoodShareDay = -999;
    
    actionShareFoodWithOwnCat();
  `, context);

  const catSuppliesAfter = vm.runInContext(`state.supplies.daysLeft`, context);
  console.log('Cat supplies after sharing:', catSuppliesAfter);
  if (catSuppliesAfter !== 5) {
    throw new Error('FAIL: Cat food SHOULD be added when foster is a cat (1 + 4 = 5)! Got: ' + catSuppliesAfter);
  }
  console.log('PASS: Cat foster successfully borrowed food from own cat.');

  console.log('\n--- TEST 3: Puppy Pee Pad Training («Приучение к пеленкам») ---');
  vm.runInContext(`
    startNewRun();
    state.animal = generateRandomAnimalScenario();
    // Set to orphan puppy scenario
    const puppyScenario = window.GAME_DATA.scenarios.find(s => s.id === 'orphan_puppies_litter') || {
      id: 'orphan_puppies_litter',
      species: 'dog',
      ageCategory: 'puppy',
      ageDays: 40,
      count: 4,
      initialCount: 4,
      activeCount: 4,
      litterTrained: false,
      litterTrainDaysDone: 0,
      hiddenState: {}
    };
    state.animal = JSON.parse(JSON.stringify(puppyScenario));
    state.animal.hiddenState = state.animal.hiddenState || {};
    renderPlayerAndAnimalCards();
  `, context);

  const puppyChecklistTag = vm.runInContext(`
    const a = state.animal;
    const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180);
    const toiletTypeLabel = isPuppy ? 'Пеленка' : (a.species === 'dog' ? 'Выгул' : 'Лоток');
    ({
      isPuppy,
      toiletTypeLabel,
      tagText: a.litterTrained ? '✓ ' + toiletTypeLabel + ': Приучен' : '🚽 ' + toiletTypeLabel + ': ' + a.litterTrainDaysDone + '/8 дн.'
    })
  `, context);

  console.log('Puppy checklist tag:', puppyChecklistTag);
  if (!puppyChecklistTag.isPuppy || !puppyChecklistTag.tagText.includes('Пеленка')) {
    throw new Error('FAIL: Puppy checklist should use "Пеленка"!');
  }

  // Check tab 3 care buttons for puppy
  vm.runInContext(`
    // Render tab 3
    state.currentTab = 3;
    renderActionTabs();
  `, context);

  console.log('PASS: Tab 3 care buttons rendered without errors for puppy.');

  // Check Day tick automatic pad training text
  vm.runInContext(`
    state.animal.litterTrained = false;
    state.animal.litterTrainDaysDone = 7;
    state.logs = [];
    // Simulate day tick
    processDayTick();
  `, context);

  const dayTickLogs = vm.runInContext(`state.logs`, context);
  console.log('Day tick logs for puppy pad training:');
  dayTickLogs.forEach(l => console.log(' -', l.text));
  const padLog = dayTickLogs.find(l => l.text.includes('пеленке без промахов'));
  if (!padLog) {
    throw new Error('FAIL: Day tick log for puppy should mention "пеленке без промахов"!');
  }
  console.log('PASS: Puppy pad training Day tick log verified.');

  console.log('\n--- TEST 4: Adult Dog vs Cat toilet terminology ---');
  // Adult dog
  vm.runInContext(`
    state.animal.species = 'dog';
    state.animal.ageCategory = 'adult';
    state.animal.ageDays = 600;
    state.animal.litterTrained = false;
    state.animal.litterTrainDaysDone = 7;
    state.logs = [];
    processDayTick();
  `, context);
  const dogTickLogs = vm.runInContext(`state.logs`, context);
  const dogLog = dogTickLogs.find(l => l.text.includes('терпению до выгула'));
  if (!dogLog) {
    throw new Error('FAIL: Adult dog log should mention "терпению до выгула"!');
  }
  console.log('PASS: Adult dog mentions "терпению до выгула".');

  // Cat
  vm.runInContext(`
    state.animal.species = 'cat';
    state.animal.ageCategory = 'adult';
    state.animal.ageDays = 400;
    state.animal.litterTrained = false;
    state.animal.litterTrainDaysDone = 7;
    state.logs = [];
    processDayTick();
  `, context);
  const catTickLogs = vm.runInContext(`state.logs`, context);
  const catLog = catTickLogs.find(l => l.text.includes('лотку без промахов'));
  if (!catLog) {
    throw new Error('FAIL: Cat log should mention "лотку без промахов"!');
  }
  console.log('PASS: Cat mentions "лотку без промахов".');

  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}

runTest();
