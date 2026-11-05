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
    'endGameOverviewBanner', 'endBannerTitle', 'endBannerSubtitle'
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
  console.log('--- TEST SUITE: Highlighting Fatal Candidate Mistake in Educational Debrief ---');
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

  const { context, domElements } = setupTestEnvironment();

  // Test 1: Helper functions exist in context
  test('Debrief helper functions renderCandidateMistakeHighlight and getFatalCandidateMistakeInfo exist', () => {
    assert.strictEqual(typeof context.renderCandidateMistakeHighlight, 'function', 'renderCandidateMistakeHighlight should be a function');
    assert.strictEqual(typeof context.getFatalCandidateMistakeInfo, 'function', 'getFatalCandidateMistakeInfo should be a function');
  });

  // Test 2: Uninspected slot 2 red flag extraction and formatting
  test('Candidate call with slot2.flag === "red" and slot2Inspected === false extracts slot 2 title, quote, and marks as skipped', () => {
    const candidateData = {
      id: 'call_bones_and_pork',
      candidateName: 'Анатолий, 56 лет',
      slot1: { title: 'Безопасность и окна', text: 'Квартира на 2 этаже.', flag: 'green' },
      slot2: { title: 'Кормление и бюджет на ветеринара', text: '«Кормим жареной свининкой и вареными трубчатыми костями кур. К врачам не возим — химия».', flag: 'red' },
      slot3: { title: 'Мотивация и договор', text: 'Хотим собаку во двор.', flag: 'green' },
      slot2Inspected: false,
      slot3Inspected: false
    };

    const info = context.getFatalCandidateMistakeInfo(candidateData);
    assert.ok(info, 'getFatalCandidateMistakeInfo should return info object');
    assert.strictEqual(info.slotIndex, 2);
    assert.strictEqual(info.slotTitle, 'Кормление и бюджет на ветеринара');
    assert.strictEqual(info.isSkipped, true);
    assert.strictEqual(info.badgeText, '❌ Вопрос пропущен (не спросили)');
    assert.ok(info.slotText.includes('свининкой'), 'slotText contains quote');

    const html = context.renderCandidateMistakeHighlight(candidateData);
    assert.ok(html.includes('РОКОВАЯ ОШИБКА ПРИ ЗВОНКЕ: Кормление и бюджет на ветеринара'), 'HTML includes title');
    assert.ok(html.includes('❌ Вопрос пропущен (не спросили)'), 'HTML includes skipped badge');
    assert.ok(html.includes('свининкой'), 'HTML includes quote');
    assert.ok(html.includes('Цитата кандидата:'), 'HTML includes quote label');
  });

  // Test 3: Uninspected slot 3 red flag extraction and formatting
  test('Candidate call with slot3.flag === "red" and slot3Inspected === false extracts slot 3 title, quote, and marks as skipped', () => {
    const candidateData = {
      id: 'call_anti_spay_aesthetic',
      candidateName: 'Валентина, 52 года',
      slot1: { title: 'Безопасность и окна', text: 'Сетки стоят.', flag: 'green' },
      slot2: { title: 'Кормление и бюджет на ветеринара', text: 'Покупаем супер-премиум.', flag: 'green' },
      slot3: { title: 'Мотивация и договор', text: '«Категорически против стерилизации! Хотим получить потомство для здоровья, а котят раздадим на рынке. Договор не подпишем».', flag: 'red' },
      slot2Inspected: true,
      slot3Inspected: false
    };

    const info = context.getFatalCandidateMistakeInfo(candidateData);
    assert.ok(info, 'getFatalCandidateMistakeInfo should return info object');
    assert.strictEqual(info.slotIndex, 3);
    assert.strictEqual(info.slotTitle, 'Мотивация и договор');
    assert.strictEqual(info.isSkipped, true);
    assert.strictEqual(info.badgeText, '❌ Вопрос пропущен (не спросили)');
    assert.ok(info.slotText.includes('Категорически против стерилизации'), 'slotText contains quote');

    const html = context.renderCandidateMistakeHighlight(candidateData);
    assert.ok(html.includes('РОКОВАЯ ОШИБКА ПРИ ЗВОНКЕ: Мотивация и договор'), 'HTML includes title');
    assert.ok(html.includes('❌ Вопрос пропущен (не спросили)'), 'HTML includes skipped badge');
    assert.ok(html.includes('Категорически против стерилизации'), 'HTML includes quote');
  });

  // Test 4: Inspected red flag approved anyway
  test('Candidate call with red flag inspected but accepted marks as ignored warning', () => {
    const candidateData = {
      id: 'call_window_fall_fatal',
      candidateName: 'Алена, 24 года',
      slot1: { title: 'Безопасность и окна', text: 'Окна на 9 этаже открываются нараспашку. «Сетки-антикошки ставить не буду, это развод маркетологов».', flag: 'red' },
      slot2: { title: 'Кормление и бюджет на ветеринара', text: 'Качественный сухой корм.', flag: 'green' },
      slot3: { title: 'Мотивация и договор', text: 'Готовы подписать договор.', flag: 'green' },
      slot2Inspected: true,
      slot3Inspected: true
    };

    const info = context.getFatalCandidateMistakeInfo(candidateData);
    assert.ok(info, 'getFatalCandidateMistakeInfo should return info object');
    assert.strictEqual(info.isSkipped, false);
    assert.strictEqual(info.badgeText, '⚠️ Красный флаг проигнорирован');
    assert.strictEqual(info.slotTitle, 'Безопасность и окна');

    const html = context.renderCandidateMistakeHighlight(candidateData);
    assert.ok(html.includes('РОКОВАЯ ОШИБКА ПРИ ЗВОНКЕ: Безопасность и окна'), 'HTML includes title');
    assert.ok(html.includes('⚠️ Красный флаг проигнорирован'), 'HTML includes ignored warning badge');
    assert.ok(html.includes('Сетки-антикошки ставить не буду'), 'HTML includes quote');
  });

  // Test 5: Defeat unrelated to candidate calls (e.g. burnout) returns null/empty highlight
  test('Defeat unrelated to candidate calls (burnout / null candidate) returns null / empty string without throwing', () => {
    assert.doesNotThrow(() => {
      const infoNull = context.getFatalCandidateMistakeInfo(null);
      assert.strictEqual(infoNull, null);

      const htmlNull = context.renderCandidateMistakeHighlight(null);
      assert.strictEqual(htmlNull, '');

      const infoEmpty = context.getFatalCandidateMistakeInfo({});
      assert.strictEqual(infoEmpty, null);

      const htmlEmpty = context.renderCandidateMistakeHighlight({});
      assert.strictEqual(htmlEmpty, '');
    });
  });

  // Test 6: Initial state has fatalCandidateData: null
  test('State initializes with fatalCandidateData: null', () => {
    context.resetState();
    assert.strictEqual(context.state.fatalCandidateData, null, 'state.fatalCandidateData should initialize as null');
  });

  // Test 7: triggerRedFlagDelayedStrikeModal stores trialItem.callData in state.fatalCandidateData
  test('triggerRedFlagDelayedStrikeModal sets state.fatalCandidateData from trialItem.callData', () => {
    context.resetState();
    const fakeCallData = {
      id: 'call_window_fall_fatal',
      candidateName: 'Тестовый звонок',
      consequenceText: 'Кот выпал из окна.',
      slot1: { title: 'Безопасность и окна', text: 'Окна нараспашку', flag: 'red' },
      slot2: { title: 'Корм', text: 'Ок', flag: 'green' },
      slot3: { title: 'Договор', text: 'Ок', flag: 'green' }
    };
    const trialItem = {
      petName: 'Барсик',
      adopterSummary: 'Тестовый усыновитель',
      callData: fakeCallData
    };

    context.triggerRedFlagDelayedStrikeModal(trialItem);
    assert.strictEqual(context.state.fatalCandidateData, fakeCallData, 'fatalCandidateData must be set to trialItem.callData');
  });

  // Test 8: EndGameModal DOM rendering with fatal candidate highlight
  test('triggerEndGame unhides #endModalCandidateMistakeBox and renders highlight on defeat with candidate data', () => {
    context.resetState();
    const mistakeBox = domElements['endModalCandidateMistakeBox'];
    mistakeBox.className = 'hidden mb-3';
    mistakeBox.innerHTML = '';

    context.state.fatalCandidateData = {
      id: 'call_bones_and_pork',
      slot1: { title: 'Безопасность', text: 'Ок', flag: 'green' },
      slot2: { title: 'Кормление и бюджет на ветеринара', text: '«Кормим жареной свининкой».', flag: 'red' },
      slot3: { title: 'Договор', text: 'Ок', flag: 'green' },
      slot2Inspected: false,
      slot3Inspected: false
    };
    context.state.fatalMistakeReason = 'call_bones_and_pork';

    context.triggerEndGame(false, 'Партия окончена', 'Испытательный срок провален');

    assert.strictEqual(mistakeBox.classList.contains('hidden'), false, 'Candidate mistake box should NOT have hidden class');
    assert.ok(mistakeBox.innerHTML.includes('РОКОВАЯ ОШИБКА ПРИ ЗВОНКЕ: Кормление и бюджет на ветеринара'), 'Box innerHTML contains title');
    assert.ok(mistakeBox.innerHTML.includes('❌ Вопрос пропущен (не спросили)'), 'Box innerHTML contains skipped badge');
    assert.ok(mistakeBox.innerHTML.includes('свининкой'), 'Box innerHTML contains quote');
  });

  // Test 9: EndGameModal hides #endModalCandidateMistakeBox on non-candidate defeat (e.g. burnout)
  test('triggerEndGame hides #endModalCandidateMistakeBox and clears content on non-candidate defeat', () => {
    context.resetState();
    const mistakeBox = domElements['endModalCandidateMistakeBox'];
    mistakeBox.className = 'mb-3'; // initially visible
    mistakeBox.innerHTML = '<div>старый текст</div>';

    context.state.fatalCandidateData = null;
    context.state.fatalMistakeReason = 'burnout';

    context.triggerEndGame(false, 'Выгорание куратора', 'Ментальное здоровье упало до нуля');

    assert.strictEqual(mistakeBox.classList.contains('hidden'), true, 'Candidate mistake box should have hidden class');
    assert.strictEqual(mistakeBox.innerHTML, '', 'Box innerHTML should be cleared');
  });

  // Test 10: index.html contains #endModalCandidateMistakeBox inside #endModalMistakesCard
  test('index.html contains #endModalCandidateMistakeBox inside #endModalMistakesCard', () => {
    const htmlContent = fs.readFileSync('game_modular/index.html', 'utf8');
    assert.ok(htmlContent.includes('id="endModalCandidateMistakeBox"'), 'index.html contains endModalCandidateMistakeBox id');
    const mistakesCardIdx = htmlContent.indexOf('id="endModalMistakesCard"');
    const mistakeBoxIdx = htmlContent.indexOf('id="endModalCandidateMistakeBox"');
    const mistakesTextIdx = htmlContent.indexOf('id="endModalMistakesText"');
    assert.ok(mistakesCardIdx !== -1, 'endModalMistakesCard found in index.html');
    assert.ok(mistakeBoxIdx > mistakesCardIdx && mistakeBoxIdx < mistakesTextIdx, 'endModalCandidateMistakeBox is inside endModalMistakesCard before endModalMistakesText');
  });

  console.log(`\nAll tests completed: ${passed}/${total} passed.`);
}

runTests();
