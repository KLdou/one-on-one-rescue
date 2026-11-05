const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function setupTestEnvironment(clipboardSupport = true, clipboardRejects = false) {
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
      focus: () => {},
      select: () => {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
          this.children.splice(idx, 1);
          child.parentNode = null;
        }
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
    'endModalMistakesText', 'statDays', 'statPersonalSpent', 'statVoucherUsed', 'statFilteredCalls',
    'storyCardEmoji', 'storyCardTitle', 'storyCardSubtitle', 'storyCardStatDays', 'storyCardStatPersonal',
    'storyCardStatVoucher', 'storyCardStatFiltered', 'storyCardStatAlbum', 'btnCopyStoryCard', 'btnCopyWordleSummary'
  ];
  ids.forEach(id => getOrCreateElem(id));

  const timeouts = [];
  let clipboardTextWritten = null;
  let fallbackCopiedText = null;

  const mockNavigator = clipboardSupport ? {
    clipboard: {
      writeText: (t) => {
        if (clipboardRejects) return Promise.reject(new Error('Permission denied'));
        clipboardTextWritten = t;
        return Promise.resolve();
      }
    }
  } : {};

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
      removeEventListener: () => {},
      execCommand: (cmd) => {
        if (cmd === 'copy') {
          const textarea = context.document.body.children.find(c => c.tagName === 'textarea');
          if (textarea) fallbackCopiedText = textarea.value;
          return true;
        }
        return false;
      }
    },
    navigator: mockNavigator,
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
    domElements,
    timeouts,
    getClipboardText: () => clipboardTextWritten,
    getFallbackCopiedText: () => fallbackCopiedText,
    setClipboardText: (v) => { clipboardTextWritten = v; }
  };
}

async function runTests() {
  console.log('--- TEST SUITE: Wordle-Style Social Text Sharing on Game Over ---');

  // Test 1: generateWordleSummaryText formatting and invariants
  {
    const env = setupTestEnvironment();
    const { context } = env;

    assert.strictEqual(typeof context.generateWordleSummaryText, 'function', 'generateWordleSummaryText should be a defined function');

    // Case A: Defeat due to burnout
    const stateBurnout = {
      day: 14,
      personalMoneySpent: 280,
      filteredBadCalls: 3,
      victory: false,
      fatalMistakeReason: 'burnout',
      animal: {
        petName: 'Барсик',
        species: 'cat',
        speciesLabel: 'Взрослый кот',
        title: 'Барсик с улицы'
      }
    };

    const textBurnout = context.generateWordleSummaryText(stateBurnout);
    console.log('[Test 1A Text Preview]:\n' + textBurnout);

    assert.ok(textBurnout.includes('🐾 Я и «Барсик» в симуляторе спасения (Минск):'), 'Must include pet name and city context');
    assert.ok(textBurnout.includes('14 дн.'), 'Must include days survived');
    assert.ok(textBurnout.includes('280 BYN'), 'Must include BYN spent');
    assert.ok(textBurnout.includes('3 неадекватов с Куфара'), 'Must include filtered bad calls');
    assert.ok(textBurnout.includes('выгорел на карантине'), 'Must include defeat tagline for burnout');
    assert.ok(textBurnout.includes('https://zooshans.by/help-us') || textBurnout.includes('https://zooshans.by'), 'Must include invitation link');
    assert.ok(!textBurnout.includes('$') && !textBurnout.includes('USD'), 'Currency invariant: never $ or USD');

    // Case B: Defeat due to bad adopter call
    const stateBadAdopter = {
      day: 18,
      personalMoneySpent: 350,
      filteredBadCalls: 5,
      victory: false,
      fatalMistakeReason: 'call_window_fall_fatal',
      animal: {
        petName: 'Барсик',
        species: 'cat'
      }
    };

    const textBadAdopter = context.generateWordleSummaryText(stateBadAdopter);
    assert.ok(textBadAdopter.includes('отдал сомнительным ручкам'), 'Must include tagline for bad adopter call');

    // Case C: Victory
    const stateVictory = {
      day: 25,
      personalMoneySpent: 420,
      filteredBadCalls: 7,
      victory: true,
      animal: {
        petName: 'Барсик',
        species: 'cat'
      }
    };

    const textVictory = context.generateWordleSummaryText(stateVictory);
    assert.ok(textVictory.includes('Дома навсегда! 🏆'), 'Must include victory tagline');

    // Case D: Other taglines (piroplasmosis, kitten milk, escape, etc.)
    const textPiro = context.generateWordleSummaryText({
      day: 7, personalMoneySpent: 90, filteredBadCalls: 1, victory: false, fatalMistakeReason: 'piroplasmosis', animal: { petName: 'Бобик' }
    });
    assert.ok(textPiro.includes('укус клеща (пироплазмоз)'), 'Should format piroplasmosis tagline');

    const textMilk = context.generateWordleSummaryText({
      day: 4, personalMoneySpent: 105, filteredBadCalls: 0, victory: false, fatalMistakeReason: 'cow_milk_blind_kittens', animal: { petName: 'Слепыши' }
    });
    assert.ok(textMilk.includes('ошибка выкорма малышей'), 'Should format milk mistake tagline');

    // Case E: Fallback to global state if argument is omitted
    context.state.day = 10;
    context.state.personalMoneySpent = 150;
    context.state.filteredBadCalls = 2;
    context.state.victory = true;
    context.state.animal = { petName: 'Жужик' };

    const textGlobal = context.generateWordleSummaryText();
    assert.ok(textGlobal.includes('«Жужик»'), 'Fallback to global state should use global animal name');
    assert.ok(textGlobal.includes('10 дн.'), 'Fallback should use global state.day');
    assert.ok(textGlobal.includes('150 BYN'), 'Fallback should use global state.personalMoneySpent');

    // Case F: Defensive empty object
    const textEmpty = context.generateWordleSummaryText({});
    assert.ok(textEmpty.includes('0 дн.'), 'Empty state should gracefully fallback');
    assert.ok(textEmpty.includes('0 BYN'), 'Empty state should gracefully handle 0 BYN');
    assert.ok(!textEmpty.includes('$') && !textEmpty.includes('USD'), 'Empty state respects BYN invariant');

    console.log('✓ PASS: generateWordleSummaryText formatting and invariants');
  }

  // Test 2: HTML button presence in index.html
  {
    const html = fs.readFileSync('game_modular/index.html', 'utf8');
    assert.ok(html.includes('id="btnCopyWordleSummary"'), 'index.html must contain #btnCopyWordleSummary button');
    assert.ok(html.includes('copyWordleSummaryToClipboard()'), 'button must trigger copyWordleSummaryToClipboard()');
    assert.ok(html.includes('Скопировать для комментов'), 'button must have text mentioning "Скопировать для комментов"');

    // Verify it is placed inside #endGameModal
    const modalIndex = html.indexOf('id="endGameModal"');
    const btnWordleIndex = html.indexOf('id="btnCopyWordleSummary"');
    const btnStoryIndex = html.indexOf('id="btnCopyStoryCard"');
    assert.ok(modalIndex !== -1 && btnWordleIndex > modalIndex, '#btnCopyWordleSummary must be inside #endGameModal');
    assert.ok(Math.abs(btnWordleIndex - btnStoryIndex) < 500, '#btnCopyWordleSummary should be placed alongside #btnCopyStoryCard');

    console.log('✓ PASS: HTML button presence and placement');
  }

  // Test 3: copyWordleSummaryToClipboard with navigator.clipboard
  {
    const env = setupTestEnvironment(true, false);
    const { context, domElements, timeouts, getClipboardText } = env;

    assert.strictEqual(typeof context.copyWordleSummaryToClipboard, 'function', 'copyWordleSummaryToClipboard should be a defined function');

    context.state.day = 14;
    context.state.personalMoneySpent = 280;
    context.state.filteredBadCalls = 3;
    context.state.victory = false;
    context.state.fatalMistakeReason = 'burnout';
    context.state.animal = { petName: 'Барсик' };

    const btn = domElements['btnCopyWordleSummary'];
    btn.textContent = '💬 Скопировать для комментов';
    btn.className = 'initial-class';

    context.copyWordleSummaryToClipboard();

    await new Promise(r => setTimeout(r, 10));

    assert.ok(getClipboardText(), 'Clipboard text should have been written');
    assert.ok(getClipboardText().includes('280 BYN'), 'Clipboard text must contain spent amount');
    assert.strictEqual(btn.textContent, '✓ Скопировано для комментов!', 'Button text must show temporary feedback');

    // Fast forward timeout 2500ms
    const timeout = timeouts.find(t => t.delay === 2500);
    assert.ok(timeout, 'Should register 2500ms timeout to restore button');
    timeout.fn();

    assert.strictEqual(btn.textContent, '💬 Скопировать для комментов', 'Button text should be restored after 2.5s');
    console.log('✓ PASS: copyWordleSummaryToClipboard with navigator.clipboard');
  }

  // Test 4: copyWordleSummaryToClipboard with document.execCommand fallback
  {
    const env = setupTestEnvironment(false); // No clipboard API
    const { context, domElements, timeouts, getFallbackCopiedText } = env;

    context.state.day = 14;
    context.state.personalMoneySpent = 280;
    context.state.filteredBadCalls = 3;
    context.state.victory = false;
    context.state.fatalMistakeReason = 'burnout';
    context.state.animal = { petName: 'Барсик' };

    const btn = domElements['btnCopyWordleSummary'];
    btn.textContent = '💬 Скопировать для комментов';
    btn.className = 'initial-class';

    context.copyWordleSummaryToClipboard();

    assert.ok(getFallbackCopiedText(), 'Fallback copy text should have been captured');
    assert.ok(getFallbackCopiedText().includes('280 BYN'), 'Fallback copy must contain spent amount');
    assert.strictEqual(btn.textContent, '✓ Скопировано для комментов!', 'Button text must show temporary feedback in fallback mode');

    const timeout = timeouts.find(t => t.delay === 2500);
    assert.ok(timeout, 'Should register 2500ms timeout');
    timeout.fn();
    assert.strictEqual(btn.textContent, '💬 Скопировать для комментов', 'Button restored');

    console.log('✓ PASS: copyWordleSummaryToClipboard fallback mechanism');
  }

  console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
