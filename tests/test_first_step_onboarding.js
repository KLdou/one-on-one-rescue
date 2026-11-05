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
      setAttribute: () => {},
      removeAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      focus: () => {},
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
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
    'chronicleLog'
  ];
  ids.forEach(id => getOrCreateElem(id));

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
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    setTimeout: (fn) => (typeof fn === 'function' ? fn() : null),
    setInterval: () => 1,
    clearInterval: () => {}
  };
  context.window = context;

  vm.createContext(context);
  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  return context;
}

console.log('--- Test Suite: Day 1 First Step Pulsing Outline & Badge ---');
const ctx = setupTestEnvironment();

// Initial run
ctx.startNewRun(false);

console.log('\nCase 1: Day 1 with unexamined animal (examinedWood = false)');
ctx.state.day = 1;
ctx.state.animal.examinedWood = false;
ctx.state.gameOver = false;
ctx.renderActionTabs();

const vetContainer = ctx.document.getElementById('tabContent_vet');
assert(vetContainer.children.length > 0, 'tabContent_vet should have rendered buttons');
const firstVetButton = vetContainer.children[0];

assert(
  firstVetButton.innerHTML.includes('👉 Начни отсюда (Осмотр)'),
  `Expected badge "👉 Начни отсюда (Осмотр)" on Day 1 unexamined, but got innerHTML:\n${firstVetButton.innerHTML}`
);
assert.strictEqual(
  firstVetButton.classList.contains('action-card--first-step'),
  true,
  'Button should have class action-card--first-step on Day 1 unexamined'
);
console.log('✓ Case 1 passed: First step badge and class present on Day 1');

console.log('\nCase 2: Day 1 with examined animal (examinedWood = true)');
ctx.state.day = 1;
ctx.state.animal.examinedWood = true;
ctx.renderActionTabs();

const firstVetButtonExamined = vetContainer.children[0];
assert(
  firstVetButtonExamined.innerHTML.includes('Сделано'),
  `Expected badge "Сделано" when examinedWood = true, got:\n${firstVetButtonExamined.innerHTML}`
);
assert.strictEqual(
  firstVetButtonExamined.classList.contains('action-card--first-step'),
  false,
  'Button should NOT have class action-card--first-step when already examined'
);
assert(
  !firstVetButtonExamined.innerHTML.includes('👉 Начни отсюда'),
  'Button should NOT display onboarding badge when examinedWood = true'
);
console.log('✓ Case 2 passed: Examined animal correctly removes onboarding highlight');

console.log('\nCase 3: Day 2 with unexamined animal (day = 2, examinedWood = false)');
ctx.state.day = 2;
ctx.state.animal.examinedWood = false;
ctx.renderActionTabs();

const firstVetButtonDay2 = vetContainer.children[0];
assert(
  firstVetButtonDay2.innerHTML.includes('Клиника'),
  `Expected badge "Клиника" on Day 2, got:\n${firstVetButtonDay2.innerHTML}`
);
assert.strictEqual(
  firstVetButtonDay2.classList.contains('action-card--first-step'),
  false,
  'Button should NOT have class action-card--first-step on Day 2'
);
console.log('✓ Case 3 passed: Day 2 does not show first-step badge or highlight');

console.log('\nCase 4: Day 1 with unexamined animal but gameOver = true');
ctx.state.day = 1;
ctx.state.animal.examinedWood = false;
ctx.state.gameOver = true;
ctx.renderActionTabs();

const firstVetButtonGameOver = vetContainer.children[0];
assert.strictEqual(
  firstVetButtonGameOver.classList.contains('action-card--first-step'),
  false,
  'Button should NOT have class action-card--first-step when gameOver is true'
);
console.log('✓ Case 4 passed: gameOver suppresses first-step highlight');

console.log('\nAll First Step Onboarding tests passed successfully!');
