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
      focus: () => {},
      getBoundingClientRect() {
        return {
          left: 100,
          top: 200,
          right: 250,
          bottom: 260,
          width: 150,
          height: 60,
          x: 100,
          y: 200
        };
      },
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
    'chronicleLog'
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
    _triggerAllTimeouts: () => {
      while (timeouts.length > 0) {
        const item = timeouts.shift();
        if (typeof item.fn === 'function') {
          item.fn();
        }
      }
    }
  };
  context.window = context;

  vm.createContext(context);
  codeFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
  });

  return context;
}

console.log('--- Test Suite: Floating Tactile Resource Spend Badges ---');
const ctx = setupTestEnvironment();

// ==========================================
// Test 1: computeResourceDeltas
// ==========================================
console.log('\n[Group 1] computeResourceDeltas unit tests:');
assert(
  typeof ctx.computeResourceDeltas === 'function',
  'computeResourceDeltas must be defined as a function'
);

// 1.1 Spend cash
const dSpendCash = ctx.computeResourceDeltas({ cash: 100 }, { cash: 50 });
assert.strictEqual(dSpendCash.length, 1, 'Should return 1 delta for cash spend');
assert.strictEqual(dSpendCash[0].text, '-50 BYN');
assert.strictEqual(dSpendCash[0].type, 'spend-cash');
console.log('  ✓ Spend cash: -50 BYN / spend-cash');

// 1.2 Gain cash
const dGainCash = ctx.computeResourceDeltas({ cash: 100 }, { cash: 185 });
assert.strictEqual(dGainCash.length, 1, 'Should return 1 delta for cash gain');
assert.strictEqual(dGainCash[0].text, '+85 BYN');
assert.strictEqual(dGainCash[0].type, 'gain-cash');
console.log('  ✓ Gain cash: +85 BYN / gain-cash');

// 1.3 Spend energy
const dSpendEnergy = ctx.computeResourceDeltas({ energy: 100 }, { energy: 88 });
assert.strictEqual(dSpendEnergy.length, 1);
assert.strictEqual(dSpendEnergy[0].text, '-12 ⚡');
assert.strictEqual(dSpendEnergy[0].type, 'spend-energy');
console.log('  ✓ Spend energy: -12 ⚡ / spend-energy');

// 1.4 Gain energy
const dGainEnergy = ctx.computeResourceDeltas({ energy: 50 }, { energy: 60 });
assert.strictEqual(dGainEnergy.length, 1);
assert.strictEqual(dGainEnergy[0].text, '+10 ⚡');
assert.strictEqual(dGainEnergy[0].type, 'gain-energy');
console.log('  ✓ Gain energy: +10 ⚡ / gain-energy');

// 1.5 Spend mental
const dSpendMental = ctx.computeResourceDeltas({ mental: 100 }, { mental: 95 });
assert.strictEqual(dSpendMental.length, 1);
assert.strictEqual(dSpendMental[0].text, '-5 🧠');
assert.strictEqual(dSpendMental[0].type, 'spend-mental');
console.log('  ✓ Spend mental: -5 🧠 / spend-mental');

// 1.6 Gain mental
const dGainMental = ctx.computeResourceDeltas({ mental: 50 }, { mental: 53 });
assert.strictEqual(dGainMental.length, 1);
assert.strictEqual(dGainMental[0].text, '+3 🧠');
assert.strictEqual(dGainMental[0].type, 'gain-mental');
console.log('  ✓ Gain mental: +3 🧠 / gain-mental');

// 1.7 Multiple resources changing simultaneously
const dMulti = ctx.computeResourceDeltas(
  { cash: 100, energy: 50, mental: 80 },
  { cash: 50, energy: 38, mental: 83 }
);
assert.strictEqual(dMulti.length, 3, 'Should produce 3 deltas');
assert.strictEqual(dMulti[0].text, '-50 BYN');
assert.strictEqual(dMulti[0].type, 'spend-cash');
assert.strictEqual(dMulti[1].text, '-12 ⚡');
assert.strictEqual(dMulti[1].type, 'spend-energy');
assert.strictEqual(dMulti[2].text, '+3 🧠');
assert.strictEqual(dMulti[2].type, 'gain-mental');
console.log('  ✓ Multiple deltas: -50 BYN, -12 ⚡, +3 🧠');

// 1.8 Float / decimal cash delta
const dFloatCash = ctx.computeResourceDeltas({ cash: 280 }, { cash: 263.5 });
assert.strictEqual(dFloatCash.length, 1);
assert.strictEqual(dFloatCash[0].text, '-16.5 BYN');
assert.strictEqual(dFloatCash[0].type, 'spend-cash');
console.log('  ✓ Float cash delta: -16.5 BYN');

// 1.9 No change / zero delta
const dZero = ctx.computeResourceDeltas(
  { cash: 100, energy: 100, mental: 100 },
  { cash: 100, energy: 100, mental: 100 }
);
assert.strictEqual(dZero.length, 0, 'Zero delta should return empty array');
console.log('  ✓ Zero delta returns empty array');

// 1.10 Defensive null / undefined inputs
assert.strictEqual(ctx.computeResourceDeltas(null, null).length, 0);
assert.strictEqual(ctx.computeResourceDeltas(undefined, {}).length, 0);
assert.strictEqual(ctx.computeResourceDeltas({}, {}).length, 0);
console.log('  ✓ Defensive handling for null/undefined');

// 1.11 Currency invariant: Never $ or USD
dMulti.concat(dFloatCash, dGainCash).forEach(d => {
  assert(!d.text.includes('$'), `Text must not contain $: ${d.text}`);
  assert(!d.text.includes('USD'), `Text must not contain USD: ${d.text}`);
  assert(d.text.includes('BYN') || d.text.includes('⚡') || d.text.includes('🧠'));
});
console.log('  ✓ Currency invariant passed: strictly BYN');

// ==========================================
// Test 2: spawnFloatingResourceBadges
// ==========================================
console.log('\n[Group 2] spawnFloatingResourceBadges tests:');
assert(
  typeof ctx.spawnFloatingResourceBadges === 'function',
  'spawnFloatingResourceBadges must be defined'
);

const mockAnchor = ctx.document.createElement('button');
mockAnchor.getBoundingClientRect = () => ({
  left: 100,
  top: 200,
  right: 250,
  bottom: 260,
  width: 150,
  height: 60,
  x: 100,
  y: 200
});

ctx.document.body.children = [];
ctx.spawnFloatingResourceBadges(mockAnchor, [
  { text: '-50 BYN', type: 'spend-cash' },
  { text: '-12 ⚡', type: 'spend-energy' }
]);

assert.strictEqual(ctx.document.body.children.length, 2, 'Should append 2 badges to body');
const b1 = ctx.document.body.children[0];
const b2 = ctx.document.body.children[1];

assert(b1.classList.contains('floating-resource-pill'), 'b1 should have class floating-resource-pill');
assert(b1.classList.contains('spend-cash'), 'b1 should have modifier spend-cash');
assert.strictEqual(b1.textContent, '-50 BYN');

assert(b2.classList.contains('floating-resource-pill'), 'b2 should have class floating-resource-pill');
assert(b2.classList.contains('spend-energy'), 'b2 should have modifier spend-energy');
assert.strictEqual(b2.textContent, '-12 ⚡');

// Positions should be populated
assert(b1.style.left && b1.style.top, 'Badge 1 should have inline position left/top');
assert(b2.style.left && b2.style.top, 'Badge 2 should have inline position left/top');

// Trigger timeouts -> badges removed from body
ctx._triggerAllTimeouts();
assert.strictEqual(ctx.document.body.children.length, 0, 'Badges should be removed after timeout');
console.log('  ✓ Badges created, styled, positioned, and cleaned up after timeout');

// Defensive check for headless/null anchor
ctx.spawnFloatingResourceBadges(null, [{ text: '-50 BYN', type: 'spend-cash' }]);
ctx.spawnFloatingResourceBadges(mockAnchor, []);
console.log('  ✓ Defensive checks for null/empty badge spawning passed');

// ==========================================
// Test 3: renderButtonGrid action click integration
// ==========================================
console.log('\n[Group 3] renderButtonGrid click integration tests:');
ctx.startNewRun(false);
ctx.state.cash = 300;
ctx.state.energy = 100;
ctx.state.mental = 100;

ctx.document.body.children = [];
let clicked = false;
let passedEvent = null;

const testButton = {
  id: 'test_action',
  title: 'Тестовая процедура',
  sub: 'Списание ресурсов',
  state: 'active',
  costBYN: 50,
  costEnergy: 12,
  onClick: (e) => {
    clicked = true;
    passedEvent = e;
    ctx.state.cash -= 50;
    ctx.state.energy -= 12;
    return 'action_result_ok';
  }
};

ctx.renderButtonGrid('tabContent_vet', [testButton]);
const renderedBtn = ctx.document.getElementById('tabContent_vet').children[0];
assert(renderedBtn, 'Rendered button should exist');

const mockEvent = { type: 'click' };
const clickRet = renderedBtn.onclick(mockEvent);

assert.strictEqual(clicked, true, 'Original onClick should be called');
assert.strictEqual(passedEvent, mockEvent, 'Event should be passed to onClick');
assert.strictEqual(clickRet, 'action_result_ok', 'Return value should be preserved');

// Verify that floating badges were spawned into body
assert(
  ctx.document.body.children.length >= 2,
  `Expected at least 2 floating badges spawned in body, got ${ctx.document.body.children.length}`
);
const spawnedTexts = ctx.document.body.children.map(c => c.textContent);
assert(spawnedTexts.includes('-50 BYN'), `Spawned badges should contain -50 BYN: ${spawnedTexts}`);
assert(spawnedTexts.includes('-12 ⚡'), `Spawned badges should contain -12 ⚡: ${spawnedTexts}`);
console.log('  ✓ Button click wrapped cleanly, executed action, and spawned tactile badges');

// ==========================================
// Test 4: CSS file validation
// ==========================================
console.log('\n[Group 4] CSS styles verification:');
const cssContent = fs.readFileSync('game_modular/css/styles.css', 'utf8');

assert(
  cssContent.includes('@keyframes floatResourceBadge'),
  'styles.css must contain @keyframes floatResourceBadge'
);
assert(
  cssContent.includes('.floating-resource-pill'),
  'styles.css must define .floating-resource-pill'
);
const requiredModifiers = [
  'spend-cash',
  'gain-cash',
  'spend-energy',
  'gain-energy',
  'spend-mental',
  'gain-mental'
];
requiredModifiers.forEach(mod => {
  assert(
    cssContent.includes(mod),
    `styles.css must contain modifier class .${mod}`
  );
});
console.log('  ✓ CSS contains floatResourceBadge keyframes and all required modifier classes');

console.log('\nAll tests passed successfully!');
