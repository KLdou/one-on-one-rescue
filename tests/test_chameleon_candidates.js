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
      disabled: false,
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
    'endGameOverviewBanner', 'endBannerTitle', 'endBannerSubtitle', 'supplyDaysBadge', 'energyReserveLabel',
    'candidateInterviewModal', 'candidateBadge', 'candidateSourceTag', 'candidateNameHousing', 'candidateDialogueText',
    'candidateSlot1Box', 'candidateSlot1Text', 'candidateSlot1Flag',
    'candidateSlot2Box', 'candidateSlot2Text', 'candidateSlot2Flag', 'slot2ClosedView', 'slot2OpenView',
    'candidateSlot3Box', 'candidateSlot3Text', 'candidateSlot3Flag', 'slot3ClosedView', 'slot3OpenView',
    'candidatePhotoCheckResultBox', 'candidateActionButtons'
  ];
  ids.forEach(id => getOrCreateElem(id));

  const timeouts = [];

  const context = {
    console,
    Math,
    Date,
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
  console.log('--- TEST SUITE: Chameleon Candidates & Deep Photo Check (-20⚡) ---');
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

  const env = setupTestEnvironment();
  const { context, domElements } = env;

  // Test 1: CHAMELEON_CANDIDATES array definition and properties
  test('1. CHAMELEON_CANDIDATES array exists with all 3 candidates and expected structure', () => {
    const list = context.CHAMELEON_CANDIDATES;
    assert(Array.isArray(list), 'CHAMELEON_CANDIDATES must be an array');
    assert.strictEqual(list.length, 3, 'Must contain exactly 3 chameleon candidates');

    const [c1, c2, c3] = list;

    // Candidate 1: Plastic mosquito net
    assert.strictEqual(c1.id, 'cham_plastic_mosquito_net');
    assert.strictEqual(c1.hasHiddenRedFlag, true);
    assert.strictEqual(c1.returnRiskIfAdopted, 0.9);
    assert.strictEqual(c1.isSafe, false);
    assert.strictEqual(c1.slot1.flag, 'green');
    assert.strictEqual(c1.slot2.flag, 'green');
    assert.strictEqual(c1.slot3.flag, 'green');
    assert.strictEqual(c1.photoCheckResult.costEnergy, 20);
    assert.strictEqual(c1.photoCheckResult.mentalImpact, -5);
    assert.strictEqual(c1.photoCheckResult.savedFromDisaster, true);
    assert.strictEqual(c1.returnEvent.daysUntilReturn, 3);
    assert.strictEqual(c1.returnEvent.penalties.petHealthDelta, -25);
    assert.strictEqual(c1.returnEvent.penalties.curatorMentalDelta, -35);
    assert.strictEqual(c1.returnEvent.penalties.vetBillByn, 90);
    assert.strictEqual(c1.returnEvent.penalties.resetPr, true);

    // Candidate 2: Secret gift with allergy
    assert.strictEqual(c2.id, 'cham_secret_gift_allergy');
    assert.strictEqual(c2.hasHiddenRedFlag, true);
    assert.strictEqual(c2.returnRiskIfAdopted, 0.85);
    assert.strictEqual(c2.isSafe, false);
    assert.strictEqual(c2.slot1.flag, 'green');
    assert.strictEqual(c2.slot2.flag, 'green');
    assert.strictEqual(c2.slot3.flag, 'green');
    assert.strictEqual(c2.photoCheckResult.costEnergy, 20);
    assert.strictEqual(c2.photoCheckResult.mentalImpact, -5);
    assert.strictEqual(c2.photoCheckResult.savedFromDisaster, true);
    assert.strictEqual(c2.returnEvent.daysUntilReturn, 4);
    assert.strictEqual(c2.returnEvent.penalties.petHealthDelta, -15);
    assert.strictEqual(c2.returnEvent.penalties.curatorMentalDelta, -30);
    assert.strictEqual(c2.returnEvent.penalties.vetBillByn, 0);
    assert.strictEqual(c2.returnEvent.penalties.resetPr, true);

    // Candidate 3: Genuine ideal adopter
    assert.strictEqual(c3.id, 'cham_genuine_ideal_adopter');
    assert.strictEqual(c3.hasHiddenRedFlag, false);
    assert.strictEqual(c3.returnRiskIfAdopted, 0.0);
    assert.strictEqual(c3.isSafe, true);
    assert.strictEqual(c3.slot1.flag, 'green');
    assert.strictEqual(c3.slot2.flag, 'green');
    assert.strictEqual(c3.slot3.flag, 'green');
    assert.strictEqual(c3.photoCheckResult.costEnergy, 20);
    assert.strictEqual(c3.photoCheckResult.mentalImpact, 10);
    assert.strictEqual(c3.photoCheckResult.savedFromDisaster, false);
  });

  // Test 2: 35% chance to roll chameleon in realPracticeMode
  test('2. triggerRandomAdopterCall rolls chameleon when realPracticeMode is true and rand < 0.35', () => {
    context.resetState();
    context.state.newborn.active = false;
    context.state.realPracticeMode = true;

    const originalRandom = context.Math.random;
    try {
      // Force roll < 0.35
      context.Math.random = () => 0.1;
      context.triggerRandomAdopterCall();

      assert(context.currentCandidateCall, 'Call modal should set currentCandidateCall');
      assert(context.currentCandidateCall.isChameleon, 'Picked call should be a chameleon candidate');
      assert(
        ['cham_plastic_mosquito_net', 'cham_secret_gift_allergy', 'cham_genuine_ideal_adopter'].includes(context.currentCandidateCall.id),
        'Candidate ID should be one of CHAMELEON_CANDIDATES'
      );

      // When rand >= 0.35, standard call is rolled
      context.Math.random = () => 0.5;
      context.triggerRandomAdopterCall();
      assert(!context.currentCandidateCall.isChameleon, 'Candidate should not be chameleon when rand >= 0.35');

      // When realPracticeMode is false, chameleon is never rolled even if rand < 0.35
      context.state.realPracticeMode = false;
      context.Math.random = () => 0.1;
      context.triggerRandomAdopterCall();
      assert(!context.currentCandidateCall.isChameleon, 'Chameleon should NOT be rolled if realPracticeMode is false');
    } finally {
      context.Math.random = originalRandom;
    }
  });

  // Test 3: ensureCandidateCallSlots formats slots with green flags for chameleon
  test('3. ensureCandidateCallSlots formats all 3 slots as green for chameleon', () => {
    const cham = {
      id: 'cham_plastic_mosquito_net',
      isChameleon: true,
      hasHiddenRedFlag: true
    };
    context.ensureCandidateCallSlots(cham, context.state.animal);
    assert.strictEqual(cham.slot1.flag, 'green', 'Slot 1 flag must be green');
    assert.strictEqual(cham.slot2.flag, 'green', 'Slot 2 flag must be green');
    assert.strictEqual(cham.slot3.flag, 'green', 'Slot 3 flag must be green');
  });

  // Test 4: actionRequestPhotoCheck() unmasks hidden red flag, spends 20⚡, mental -5, blocks adoption
  test('4. actionRequestPhotoCheck() on hidden red flag spends 20⚡, decreases mental -5, unmasks and blocks', () => {
    context.resetState();
    context.state.newborn.active = false;
    context.state.energy = 50;
    context.state.mental = 60;

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    context.triggerIncomingCallModal(candidate, false);

    assert.strictEqual(context.currentCandidateCall.id, 'cham_plastic_mosquito_net');
    assert.strictEqual(context.currentCandidateCall.photoChecked, false);

    // Call actionRequestPhotoCheck
    context.actionRequestPhotoCheck();

    assert.strictEqual(context.state.energy, 30, 'Energy should be deducted by 20⚡');
    assert.strictEqual(context.state.mental, 55, 'Mental should be reduced by 5🧠 (-5)');
    assert.strictEqual(context.currentCandidateCall.photoChecked, true, 'photoChecked should be true');
    assert.strictEqual(context.currentCandidateCall.unmasked, true, 'unmasked should be true');
    assert.strictEqual(context.currentCandidateCall.blocked, true, 'Candidate should be blocked');

    // UI elements check
    const photoBox = domElements.candidatePhotoCheckResultBox;
    assert(!photoBox.classList.contains('hidden'), 'Result box should no longer be hidden');
    assert(photoBox.innerHTML.includes(candidate.photoCheckResult.revealedTruth), 'Result box should show revealed truth');

    // Adoption buttons check
    const actionButtons = domElements.candidateActionButtons.children;
    for (const btn of actionButtons) {
      if (btn.textContent.includes('Отдать') || btn.textContent.includes('Компромисс')) {
        assert(btn.disabled, 'Adoption buttons must be disabled when candidate is blocked');
      }
    }
  });

  // Test 5: actionRequestPhotoCheck() on genuine ideal adopter grants mental +10 and confirms 0% return risk
  test('5. actionRequestPhotoCheck() on genuine ideal adopter grants mental +10 and verifies safe (0% risk)', () => {
    context.resetState();
    context.state.newborn.active = false;
    context.state.energy = 50;
    context.state.mental = 60;

    const idealCham = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[2]));
    context.triggerIncomingCallModal(idealCham, false);

    assert.strictEqual(context.currentCandidateCall.id, 'cham_genuine_ideal_adopter');

    context.actionRequestPhotoCheck();

    assert.strictEqual(context.state.energy, 30, 'Energy should be deducted by 20⚡');
    assert.strictEqual(context.state.mental, 70, 'Mental should increase by 10🧠 (+10)');
    assert.strictEqual(context.currentCandidateCall.photoChecked, true);
    assert.strictEqual(context.currentCandidateCall.verifiedSafe, true);
    assert.strictEqual(context.currentCandidateCall.returnRiskIfAdopted, 0.0);
    assert(!context.currentCandidateCall.blocked, 'Candidate should NOT be blocked');

    const photoBox = domElements.candidatePhotoCheckResultBox;
    assert(!photoBox.classList.contains('hidden'), 'Result box should be visible');
    assert(photoBox.innerHTML.includes(idealCham.photoCheckResult.revealedTruth), 'Result box should show verified photos truth');
  });

  // Test 6: Energy check guard (< 20⚡ prevents photo check) and idempotent check
  test('6. actionRequestPhotoCheck requires 20⚡ and cannot be used twice on the same candidate', () => {
    context.resetState();
    context.state.newborn.active = false;
    context.state.energy = 15; // less than 20
    context.state.mental = 60;

    const candidate = JSON.parse(JSON.stringify(context.CHAMELEON_CANDIDATES[0]));
    context.triggerIncomingCallModal(candidate, false);

    context.actionRequestPhotoCheck();

    assert.strictEqual(context.state.energy, 15, 'Energy should not change if < 20');
    assert.strictEqual(context.state.mental, 60, 'Mental should not change');
    assert.strictEqual(context.currentCandidateCall.photoChecked, false);

    // Give enough energy and check
    context.state.energy = 25;
    context.actionRequestPhotoCheck();
    assert.strictEqual(context.state.energy, 5);
    assert.strictEqual(context.currentCandidateCall.photoChecked, true);

    // Second call does nothing
    context.actionRequestPhotoCheck();
    assert.strictEqual(context.state.energy, 5, 'Energy should not be deducted again');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
