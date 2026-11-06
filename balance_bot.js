#!/usr/bin/env node
/**
 * balance_bot.js — Автономный Headless-симулятор и стенд балансировки (Monte Carlo Balance Engine)
 * для игры «Один на один: Симулятор спасения» (v2.2 / v2.3).
 *
 * Особенности:
 * - Zero-DOM & Zero-Dependencies: работает напрямую в Node.js через встроенный модуль `vm`.
 * - Data-Driven (Zero-Hardcode): перехватывает динамические карточки из `renderButtonGrid`
 *   и модальные окна `showEventModal` / `triggerIncomingCallModal`.
 * - Автоматически поддерживает любые новые сценарии, добавленные в `data/scenarios.json` или `data_loader.js`.
 * - Включает статический линтер сценариев, Seeded PRNG (Mulberry32), 4 архетипа ботов,
 *   инкрементальный кэш `.balance_cache.json` и экспорт детальной телеметрии в `balance_report.json`.
 *
 * Примеры запуска:
 *   node balance_bot.js                        # Стандартный прогон (по 100 партий на сценарий для 4 ботов)
 *   node balance_bot.js --runs=300             # Глубокий прогон (по 300 партий)
 *   node balance_bot.js --bot=expert           # Прогон только за Опытного куратора
 *   node balance_bot.js --scenario=severe_trauma_sheri_dog --runs=500
 *   node balance_bot.js --real-practice        # Включить хардкор-режим «Реальная практика»
 *   node balance_bot.js --changed              # Проверить только новые или измененные сценарии
 *   node balance_bot.js --lint-only            # Только статическая валидация JSON и флагов
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

// ============================================================================
// 1. ПАРСИНГ АРГУМЕНТОВ КОМАНДНОЙ СТРОКИ (CLI)
// ============================================================================
const args = process.argv.slice(2);
const CLI = {
  runs: 100,
  bot: 'all', // 'all' | 'naive' | 'novice' | 'expert' | 'greedy'
  scenario: 'all',
  seed: 20260512,
  maxDays: 250,
  realPractice: false,
  changedOnly: false,
  lintOnly: false,
  replaySeed: null,
  verbose: false,
  outJson: 'balance_report.json',
  cacheFile: '.balance_cache.json',
  gameDir: __dirname
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--runs=')) CLI.runs = Math.max(1, parseInt(arg.split('=')[1], 10) || 100);
  else if (arg === '--runs' && i + 1 < args.length) CLI.runs = Math.max(1, parseInt(args[++i], 10) || 100);
  else if (arg.startsWith('--bot=')) CLI.bot = arg.split('=')[1].trim();
  else if (arg === '--bot' && i + 1 < args.length) CLI.bot = args[++i].trim();
  else if (arg.startsWith('--scenario=')) CLI.scenario = arg.split('=')[1].trim();
  else if (arg === '--scenario' && i + 1 < args.length) CLI.scenario = args[++i].trim();
  else if (arg.startsWith('--seed=')) CLI.seed = parseInt(arg.split('=')[1], 10) || 20260512;
  else if (arg === '--seed' && i + 1 < args.length) CLI.seed = parseInt(args[++i], 10) || 20260512;
  else if (arg.startsWith('--replay=')) {
    CLI.replaySeed = parseInt(arg.split('=')[1], 10);
    CLI.runs = 1;
    CLI.verbose = true;
  }
  else if (arg === '--replay' && i + 1 < args.length) {
    CLI.replaySeed = parseInt(args[++i], 10);
    CLI.runs = 1;
    CLI.verbose = true;
  }
  else if (arg === '--verbose') CLI.verbose = true;
  else if (arg.startsWith('--max-days=')) CLI.maxDays = parseInt(arg.split('=')[1], 10) || 250;
  else if (arg === '--max-days' && i + 1 < args.length) CLI.maxDays = parseInt(args[++i], 10) || 250;
  else if (arg.startsWith('--dir=')) CLI.gameDir = path.resolve(arg.split('=')[1]);
  else if (arg === '--dir' && i + 1 < args.length) CLI.gameDir = path.resolve(args[++i]);
  else if (arg.startsWith('--out=')) CLI.outJson = arg.split('=')[1].trim();
  else if (arg === '--out' && i + 1 < args.length) CLI.outJson = args[++i].trim();
  else if (arg === '--real-practice') CLI.realPractice = true;
  else if (arg === '--changed' || arg === '--smart') CLI.changedOnly = true;
  else if (arg === '--lint-only') CLI.lintOnly = true;
}

// ============================================================================
// 2. ДЕТЕРМИНИРОВАННЫЙ ГСЧ (MULBERRY32 SEEDED PRNG)
// ============================================================================
function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function md5(data) {
  return crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

// ============================================================================
// 3. ПОИСК И ЗАГРУЗКА ИСХОДНИКОВ ИГРЫ
// ============================================================================
function resolveJsFile(baseDir, fileName) {
  const candidates = [
    path.join(baseDir, 'js', fileName),
    path.join(baseDir, fileName),
    path.join(baseDir, 'game_modular', 'js', fileName)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Не найден файл модуля игры: ${fileName} (проверены пути в ${baseDir})`);
}

function resolveDataJson(baseDir, jsonName) {
  const candidates = [
    path.join(baseDir, 'data', jsonName),
    path.join(baseDir, jsonName),
    path.join(baseDir, 'game_modular', 'data', jsonName)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return JSON.parse(fs.readFileSync(c, 'utf8'));
      } catch (e) {
        console.warn(`⚠️ Ошибка чтения JSON ${c}: ${e.message}`);
      }
    }
  }
  return null;
}

const MODULE_ORDER = [
  'data_loader.js',
  'state.js',
  'engine.js',
  'events.js',
  'actions.js',
  'adopters.js',
  'ui.js'
];

function loadGameSources(baseDir) {
  const sources = {};
  for (const mod of MODULE_ORDER) {
    const fullPath = resolveJsFile(baseDir, mod);
    sources[mod] = {
      path: fullPath,
      code: fs.readFileSync(fullPath, 'utf8')
    };
  }
  return sources;
}

// ============================================================================
// 4. HEADLESS-ОБОЛОЧКА (ZERO-DOM SANDBOX)
// ============================================================================
function createVirtualDOM() {
  const elements = new Map();

  function createStubElement(id = '') {
    const classSet = new Set(['hidden']);
    const el = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      disabled: false,
      checked: false,
      title: '',
       _className: 'hidden',
      dataset: {},
      style: { width: '0%', left: '0px', top: '0px', display: '' },
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        contains: (c) => classSet.has(c),
        toggle: (c) => (classSet.has(c) ? classSet.delete(c) : classSet.add(c))
      },
      setAttribute: (k, v) => { el[k] = v; },
      getAttribute: (k) => el[k] || null,
      appendChild: () => {},
      removeChild: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
      closest: () => null,
      focus: () => {},
      select: () => {},
      addEventListener: () => {}
    };
    Object.defineProperty(el, 'className', {
      get() { return Array.from(classSet).join(' '); },
      set(val) {
        classSet.clear();
        String(val || '').split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      }
    });
    return el;
  }

  const documentStub = {
    body: createStubElement('body'),
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createStubElement(id));
      }
      return elements.get(id);
    },
    createElement(tag) {
      return createStubElement(tag);
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    execCommand() { return true; }
  };

  return { documentStub, elements };
}

function createGameSandbox(sources, externalJsonData) {
  const { documentStub } = createVirtualDOM();
  const storageMap = new Map();

  const localStorageStub = {
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear()
  };

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    document: documentStub,
    localStorage: localStorageStub,
    navigator: {
      clipboard: { writeText: () => Promise.resolve() }
    },
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    alert: () => {},
    confirm: () => true,
    prompt: () => 'Барсик',
    Date,
    Math: Object.create(Math),
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Error,
    Promise,
    parseInt,
    parseFloat,
    isNaN
  };

  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  const context = vm.createContext(sandbox);

  for (const mod of MODULE_ORDER) {
    vm.runInContext(sources[mod].code, context, { filename: mod });
  }

  // Подгружаем свежие JSON из папки data/, если они есть на диске
  if (externalJsonData.config) sandbox.GAME_DATA.config = externalJsonData.config;
  if (externalJsonData.playerAxes) sandbox.GAME_DATA.playerAxes = externalJsonData.playerAxes;
  if (externalJsonData.coats) sandbox.GAME_DATA.coats = externalJsonData.coats;
  if (externalJsonData.scenarios) sandbox.GAME_DATA.scenarios = externalJsonData.scenarios;
  if (externalJsonData.calls) sandbox.GAME_DATA.calls = externalJsonData.calls;
  if (externalJsonData.petnames) sandbox.GAME_DATA.petnames = externalJsonData.petnames;
  if (externalJsonData.mentorHints) sandbox.GAME_DATA.mentorHints = externalJsonData.mentorHints;

  return { sandbox, context, localStorageStub };
}

// ============================================================================
// 5. СТАТИЧЕСКИЙ ЛИНТЕР СЦЕНАРИЕВ И ДЕТЕКТОР СИРОТСКИХ ФЛАГОВ
// ============================================================================
function runStaticLinter(gameData, sources) {
  const issues = [];
  const warnings = [];
  const scenarios = gameData.scenarios || [];
  const catCoats = (gameData.coats && gameData.coats.catCoats) || {};
  const dogCoats = (gameData.coats && gameData.coats.dogCoats) || [];

  const logicCodeCombined = ['state.js', 'engine.js', 'events.js', 'actions.js', 'adopters.js', 'ui.js']
    .map(m => sources[m].code)
    .join('\n');

  const seenIds = new Set();

  for (const sc of scenarios) {
    if (!sc.id) {
      issues.push('Обнаружен сценарий без поля `id`!');
      continue;
    }
    if (seenIds.has(sc.id)) {
      issues.push(`Дубликат ID сценария: "${sc.id}"`);
    }
    seenIds.add(sc.id);

    if (!['cat', 'dog'].includes(sc.species)) {
      issues.push(`[${sc.id}] Некорректный вид животного species: "${sc.species}"`);
    }
    if (typeof sc.ageDays !== 'number' || sc.ageDays <= 0) {
      issues.push(`[${sc.id}] Некорректный возраст ageDays: ${sc.ageDays}`);
    }

    // Проверка окрасов
    if (sc.species === 'cat') {
      if (sc.coatId && !catCoats[sc.coatId]) {
        issues.push(`[${sc.id}] Окрас coatId="${sc.coatId}" отсутствует в coats.json`);
      }
      if (Array.isArray(sc.allowedCoats)) {
        for (const c of sc.allowedCoats) {
          if (!catCoats[c]) {
            issues.push(`[${sc.id}] Окрас "${c}" из allowedCoats отсутствует в coats.json`);
          }
        }
      }
    } else if (sc.species === 'dog') {
      if (sc.dogCoatIndex !== undefined && !dogCoats[sc.dogCoatIndex]) {
        issues.push(`[${sc.id}] Индекс окраса собаки dogCoatIndex=${sc.dogCoatIndex} выходит за границы массива dogCoats`);
      }
    }

    // Проверка флагов hiddenState на присутствие в коде движка ("детектор сиротских флагов")
    const hs = sc.hiddenState || {};
    for (const flagKey of Object.keys(hs)) {
      const regex = new RegExp(`\\b${flagKey}\\b`);
      if (!regex.test(logicCodeCombined)) {
        warnings.push(`[${sc.id}] Сиротский флаг hiddenState.${flagKey}: ни разу не упоминается в коде движка/событий!`);
      }
    }

    // Проверка строковых значений вирусов и носительства
    if (hs.deadlyVirus && typeof hs.deadlyVirus === 'string') {
      const knownViruses = ['panleukopenia', 'parvovirus_enteritis', 'rhinotracheitis_eyes'];
      if (!logicCodeCombined.includes(hs.deadlyVirus) && !knownViruses.includes(hs.deadlyVirus)) {
        warnings.push(`[${sc.id}] Неизвестный вирус deadlyVirus="${hs.deadlyVirus}": не найден обработчик в коде!`);
      }
    }
    if (hs.chronicCarrier && typeof hs.chronicCarrier === 'string') {
      const knownCarriers = ['FeLV', 'FIV'];
      if (!logicCodeCombined.includes(hs.chronicCarrier) && !knownCarriers.includes(hs.chronicCarrier)) {
        warnings.push(`[${sc.id}] Неизвестный носитель chronicCarrier="${hs.chronicCarrier}": не найден обработчик в коде!`);
      }
    }
  }

  return { issues, warnings, totalScenarios: scenarios.length };
}

// ============================================================================
// 6. АВТО-КЛАССИФИКАТОР СЛОЖНОСТИ СЦЕНАРИЯ (TIER AUTO-ASSIGNER — S_score)
// ============================================================================
function classifyScenarioTier(sc) {
  const h = sc.hiddenState || {};
  const maxCount = sc.countRange ? sc.countRange[1] : (sc.count || 1);

  // Формула тяжести сценария (S_score) согласно GDD v2.2 и спецификации v1.0
  const countFactor = (maxCount - 1) * 12;
  const isNewborn = h.isNewborn ? 35 : 0;
  const isTrauma = h.hasSevereTrauma ? 40 : 0;
  const isVirus = (h.deadlyVirus === 'panleukopenia' || h.deadlyVirus === 'parvovirus_enteritis') ? 35 : (h.deadlyVirus ? 20 : 0);
  const isRingworm = h.ringworm ? 20 : 0;
  const isPregnant = h.isPregnant ? 25 : 0;
  const isCarrier = h.chronicCarrier ? 20 : 0;
  const isDog = sc.species === 'dog' ? 15 : 0;
  const isKittenSeason = h.isKittenSeason ? 25 : 0;
  const isChronicGI = h.hasChronicGI ? 20 : 0;
  const isSocialization = h.needsSocialization ? 15 : 0;

  // Окрас и базовая популярность (если указан)
  let popPenalty = 7.5; // средний уровень (1 - 0.5) * 15
  if (sc.species === 'cat' && sc.coatId === 'purebred') popPenalty = 0;
  if (sc.species === 'cat' && sc.coatId === 'colorpoint') popPenalty = 2;

  const score = countFactor + isNewborn + isTrauma + isVirus + isRingworm +
    isPregnant + isCarrier + isDog + isKittenSeason + isChronicGI + isSocialization + popPenalty;

  if (score >= 50) {
    return {
      tier: 'TIER_3_HARDCORE',
      label: '🚨 Хардкор / ОРИТ',
      score: Math.round(score),
      targetExpert: [50, 78],
      targetNovice: [10, 30]
    };
  }

  if (score >= 25) {
    return {
      tier: 'TIER_2_COMPLICATED',
      label: '⚠️ Осложненный',
      score: Math.round(score),
      targetExpert: [70, 88],
      targetNovice: [30, 55]
    };
  }

  return {
    tier: 'TIER_1_STANDARD',
    label: '🟢 Стандарт',
    score: Math.round(score),
    targetExpert: [85, 96],
    targetNovice: [55, 75]
  };
}

// ============================================================================
// 7. 4 АРХЕТИПА БОТОВ И ПОЛИТИКИ ПРИНЯТИЯ РЕШЕНИЙ (ZERO-HARDCODE AI)
// ============================================================================
const BOT_PROFILES = {
  naive: {
    id: 'naive',
    name: 'Наивный обыватель',
    submitZooshansApp: false,
    useBarakholka: false,
    useStorytelling: false,
    doPcrWithoutSymptoms: false,
    buyHarnessOrTicksProactively: false,
    inspectCandidateSlots: false,
    doPhotoCheck: false,
    acceptRedFlagsChance: 0.75,
    holdFosterSpot: false,
    preferVoucherClinic: false
  },
  novice: {
    id: 'novice',
    name: 'Рациональный новичок',
    submitZooshansApp: true,
    useBarakholka: false,
    useStorytelling: true,
    doPcrWithoutSymptoms: false,
    buyHarnessOrTicksProactively: false,
    inspectCandidateSlots: true,
    doPhotoCheck: false,
    acceptRedFlagsChance: 0.0,
    holdFosterSpot: 'free_words',
    preferVoucherClinic: true
  },
  expert: {
    id: 'expert',
    name: 'Опытный куратор Зоошанса',
    submitZooshansApp: true,
    useBarakholka: true,
    useStorytelling: true,
    doPcrWithoutSymptoms: true,
    buyHarnessOrTicksProactively: true,
    inspectCandidateSlots: true,
    doPhotoCheck: true,
    acceptRedFlagsChance: 0.0,
    holdFosterSpot: true,
    preferVoucherClinic: true
  },
  greedy: {
    id: 'greedy',
    name: 'Стресс-тестер (Абузер сборов)',
    submitZooshansApp: true,
    useBarakholka: true,
    useStorytelling: true,
    doPcrWithoutSymptoms: true,
    buyHarnessOrTicksProactively: true,
    inspectCandidateSlots: true,
    doPhotoCheck: true,
    acceptRedFlagsChance: 0.0,
    holdFosterSpot: false,
    preferVoucherClinic: true,
    alwaysOpenCardFundraiser: true
  }
};

/**
 * Семантический парсер стоимости из текста кнопки модального окна:
 * извлекает конструкции вида "(-45 BYN, -25⚡, -15🧠)"
 */
function parseChoiceCosts(label) {
  const bynMatch = label.match(/-?\s*(\d+)\s*BYN/i);
  const energyMatch = label.match(/-?\s*(\d+)\s*⚡/);
  return {
    byn: bynMatch ? parseInt(bynMatch[1], 10) : 0,
    energy: energyMatch ? parseInt(energyMatch[1], 10) : 0
  };
}

/**
 * Автоматический обработчик любого модального окна `showEventModal(title, bodyText, choices)`
 */
function resolveEventModalChoice(sandbox, botProfile, title, bodyText, choices, isVerbose = false) {
  if (!Array.isArray(choices) || choices.length === 0) return;
  const st = sandbox.state;
  const tUpper = String(title || '').toUpperCase();

  const choose = (choice) => {
    if (!choice) return;
    if (isVerbose && choice.label) {
      console.log(`      👉 Решение: "${choice.label.trim().replace(/\s+/g, ' ')}"`);
    }
    return choice.action();
  };

  // 1. Вводное окно 1-го дня
  if (tUpper.includes('ВЫ НАШЛИ БЕЗДОМНОЕ ЖИВОТНОЕ')) {
    if (botProfile.id === 'naive' && sandbox.Math.random() < 0.12) {
      // Наивный иногда попадает в ловушку Гурского или коробки
      const dangerChoice = choices.find(c => c.style === 'danger');
      if (dangerChoice) return choose(dangerChoice);
    }
    const primary = choices.find(c => c.style === 'primary') || choices[0];
    return choose(primary);
  }

  // 2. Бронь места на передержке на время испытательного срока
  if (tUpper.includes('БРОНЬ МЕСТА НА ПЕРЕДЕРЖКЕ')) {
    if (botProfile.holdFosterSpot === true) {
      // Опытный: 100% бронь конфетами (15 BYN) или оплата 50% недели, либо словами
      const sweetChoice = choices.find(c => c.label.includes('конфет') || c.label.includes('15 BYN'));
      if (sweetChoice && st.cash >= 15) return choose(sweetChoice);

      const paidChoice = choices.find(c => c.style === 'primary' && c.label.includes('BYN'));
      if (paidChoice) {
        const costs = parseChoiceCosts(paidChoice.label);
        if (st.cash >= costs.byn) return choose(paidChoice);
      }

      const wordChoice = choices.find(c => c.style === 'info' && c.label.includes('словами'));
      if (wordChoice && st.energy >= 10) return choose(wordChoice);
    } else if (botProfile.holdFosterSpot === 'free_words') {
      // Новичок: пробует бесплатную просьбу словами (-10⚡, 60% шанс)
      const wordChoice = choices.find(c => c.style === 'info' && c.label.includes('словами'));
      if (wordChoice && st.energy >= 10) return choose(wordChoice);
    }
    const releaseChoice = choices[choices.length - 1];
    return choose(releaseChoice);
  }

  // 3. Запрос от волонтера на покупку таблеток для дегельминтизации
  if (tUpper.includes('ЗАПРОС ОТ ВОЛОНТЕРА')) {
    if (botProfile.useBarakholka && st.energy >= 15) {
      const fleaChoice = choices.find(c => c.label.toLowerCase().includes('барахолк'));
      if (fleaChoice) return choose(fleaChoice);
    }
    if (st.cash >= 26) {
      const buyChoice = choices.find(c => c.style === 'primary');
      if (buyChoice) return choose(buyChoice);
    }
    const fallback = choices[choices.length - 1];
    return choose(fallback);
  }

  // 4. Экстренное предупреждение о запасе корма или смеси
  if (tUpper.includes('КОРМ И НАПОЛНИТЕЛЬ') || tUpper.includes('СМЕСЬ ДЛЯ СЛЕПЫШЕЙ')) {
    const buyChoice = choices.find(c => c.style === 'primary');
    if (buyChoice) {
      const costs = parseChoiceCosts(buyChoice.label);
      if (st.cash >= costs.byn && st.energy >= costs.energy) {
        return choose(buyChoice);
      }
    }
    // Если на закупку не хватает денег — откладываем, чтобы не заблокировать тик
    const delayChoice = choices.find(c => c.style === 'secondary' || c.label.includes('Отложить'));
    if (delayChoice) return choose(delayChoice);
  }

  // 5. Второе дыхание в @zooshans_chat при ментальном истощении
  if (tUpper.includes('МОРАЛЬНОЕ ИСТОЩЕНИЕ') || tUpper.includes('ВТОРОЕ ДЫХАНИЕ')) {
    const chatChoice = choices[0];
    if (chatChoice && typeof chatChoice.action === 'function') return choose(chatChoice);
  }

  // 6. Универсальный эвристический выбор для кризисов, ЧП, стационаров и финотчетов
  // Отсекаем заведомо фатальные ловушки (style === 'danger'), если есть альтернатива
  const nonDanger = choices.filter(c => c.style !== 'danger');
  const pool = nonDanger.length > 0 ? nonDanger : choices;

  // Ищем вариант 'primary', на который хватает ресурсов
  for (const c of pool) {
    if (c.style === 'primary') {
      const costs = parseChoiceCosts(c.label);
      if (st.cash >= costs.byn && st.energy >= costs.energy) {
        return choose(c);
      }
    }
  }

  // Если не хватило на primary или primary безусловный — берем первый доступный из безопасных
  const affordable = pool.find(c => {
    const costs = parseChoiceCosts(c.label);
    return st.cash >= costs.byn && st.energy >= costs.energy;
  });

  if (affordable) return choose(affordable);
  return choose(pool[0]);
}

/**
 * Автоматический обработчик собеседования кандидатов (`triggerIncomingCallModal`)
 */
function resolveCandidateCallModal(sandbox, botProfile, callData, isVerbose = false) {
  const st = sandbox.state;
  if (!callData || st.gameOver) return;

  const refuse = (reason) => {
    if (isVerbose) console.log(`      ❌ Отказ кандидату: ${reason}`);
    return sandbox.actionRefuseCandidate();
  };

  const accept = (asPair, opts = {}) => {
    if (isVerbose) console.log(`      🤝 Кандидат одобрен (передача на испытательный срок${asPair ? ', пара' : ''})`);
    return sandbox.actionAcceptCandidate(asPair, opts);
  };

  // Мошенники
  if (callData.isScam) {
    if (botProfile.id === 'naive' && sandbox.Math.random() < 0.35) {
      accept(false);
    } else {
      refuse('мошенник / черный список');
    }
    return;
  }

  // Наивный бот не проверяет слоты и часто отдает первому попавшемуся
  if (!botProfile.inspectCandidateSlots) {
    const slot1Red = callData.slot1 && callData.slot1.flag === 'red';
    if (slot1Red && sandbox.Math.random() > botProfile.acceptRedFlagsChance) {
      refuse('красный флаг в слоте 1 (замечен наивным)');
      return;
    }
    accept(Boolean(callData.canTakePair));
    return;
  }

  // Если Слот 1 уже красный — мгновенный отказ
  if (callData.slot1 && callData.slot1.flag === 'red') {
    refuse(`красный флаг в слоте 1: "${callData.slot1.text}"`);
    return;
  }

  // Проверяем Слот 2 (-2⚡) и Слот 3 (-2⚡)
  if (!callData.slot2Inspected && st.energy >= 2) {
    sandbox.actionInspectCandidateSlot(2);
  }
  if (callData.slot2Inspected && callData.slot2 && callData.slot2.flag === 'red') {
    refuse(`красный флаг в слоте 2: "${callData.slot2.text}"`);
    return;
  }

  if (!callData.slot3Inspected && st.energy >= 2) {
    sandbox.actionInspectCandidateSlot(3);
  }
  if (callData.slot3Inspected && callData.slot3 && callData.slot3.flag === 'red') {
    refuse(`красный флаг в слоте 3: "${callData.slot3.text}"`);
    return;
  }

  // В режиме «Реальная практика» Опытный бот делает фото-проверку окон (-20⚡) у подозрительных/зеленых кандидатов
  if (botProfile.doPhotoCheck && (st.realPracticeMode || callData.isChameleon) && !callData.photoChecked) {
    if (st.energy >= 20) {
      sandbox.actionRequestPhotoCheck();
    } else if (callData.isChameleon) {
      // Если энергии на проверку фото не хватило, опытный куратор не рискует отдавать вслепую
      refuse('хамелеон без фото-проверки сеток');
      return;
    }
  }

  if (callData.blocked || callData.unmasked) {
    refuse('разоблачен как опасный кандидат');
    return;
  }

  // Обработка компромиссных («средних») ручек
  if (callData.isCompromise) {
    if (st.energy >= 15 && sandbox.spendEnergy(15)) {
      if (isVerbose) console.log('      🤝 Компромиссные ручки взяты с поддержкой куратора (шанс 95%)');
      sandbox.actionAcceptCandidate(false, { isCompromise: true, withSupport: true, successChance: 0.95 });
    } else if (botProfile.id !== 'expert') {
      if (isVerbose) console.log('      🤝 Компромиссные ручки без поддержки (шанс 65%)');
      sandbox.actionAcceptCandidate(false, { isCompromise: true, withSupport: false, successChance: 0.65 });
    } else {
      refuse('компромиссный кандидат без достаточной энергии на поддержку');
    }
    return;
  }

  // Если кандидат готов взять сразу парочку котят/щенков
  if (callData.canTakePair && st.animal && st.animal.activeCount >= 2) {
    accept(true, { successChance: 0.92 });
    return;
  }

  // Стандартная передача на 14-дневный испытательный срок
  if (callData.isTrialReturn) {
    accept(false, { isAsthmaReturn: true });
  } else if (!callData.isSafe && !(callData.isChameleon && !callData.photoChecked)) {
    refuse('кандидат не признан безопасным');
  } else {
    accept(false, { successChance: 0.92 });
  }
}

/**
 * Ежедневный цикл принятия решений бота (Zero-Hardcode Planner).
 * Анализирует `state` и перехваченные кнопки из `botAvailableActions`.
 */
function runBotDailyPlanner(sandbox, botProfile, capturedGrids) {
  const st = sandbox.state;
  if (!st || st.gameOver) return 0;

  let actionsTaken = 0;
  let guard = 0;

  while (!st.gameOver && guard < 25) {
    guard++;
    sandbox.renderAll();

    const a = st.animal;
    const z = st.zooshans;
    const nActive = a.activeCount !== undefined ? a.activeCount : (a.count || 0);

    const vetBtns = (capturedGrids.tabContent_vet || []).filter(b => b.state === 'active' && typeof b.onClick === 'function');
    const zooBtns = (capturedGrids.tabContent_zooshans || []).filter(b => b.state === 'active' && typeof b.onClick === 'function');
    const careBtns = (capturedGrids.tabContent_care || []).filter(b => b.state === 'active' && typeof b.onClick === 'function');

    const findBtn = (list, predicate) => list.find(predicate);
    let acted = false;

    // ------------------------------------------------------------------------
    // ПРИОРИТЕТ 1: ЭКСТРЕННЫЕ БАННЕРЫ ВЫЖИВАНИЯ (Слепыши, Беглец, Подарки)
    // ------------------------------------------------------------------------
    // 1.1. Выкорм слепышей
    if (st.newborn && st.newborn.active) {
      if (!st.newborn.knowsAboutFormula && botProfile.submitZooshansApp && st.energy >= 10) {
        sandbox.actionAskZooshansTakeover();
        actionsTaken++;
        acted = true;
        continue;
      }
      if (st.newborn.milkDaysLeft <= 1 && st.cash >= 105 && a.ageDays < 60) {
        sandbox.buyBabycatFormula();
        actionsTaken++;
        acted = true;
        continue;
      }
      if (sandbox.isAnimalAtPlayerHome() && !st.newborn.fedToday) {
        if (st.newborn.knowsAboutFormula && st.newborn.milkDaysLeft > 0 && st.energy >= 15) {
          sandbox.feedNewbornKittens();
          actionsTaken++;
          acted = true;
          continue;
        } else if (botProfile.id === 'naive' && !st.newborn.knowsAboutFormula) {
          sandbox.feedCowMilkTrap();
          actionsTaken++;
          acted = true;
          break;
        }
      }
    }

    // 1.2. Экстренный поиск беглеца (4 дня)
    if (st.escapeQuest && st.escapeQuest.active && st.escapeQuest.searchProgress < 100) {
      if (st.energy >= 20 && st.mental > 20) {
        sandbox.escapeSearchAction('night');
        actionsTaken++;
        acted = true;
        continue;
      } else if (st.energy >= 15) {
        sandbox.escapeSearchAction('posters');
        actionsTaken++;
        acted = true;
        continue;
      } else if (st.energy >= 10) {
        sandbox.escapeSearchAction('social');
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 1.3. Фото-благодарность за посылку добра
    if (z.pendingGiftThankYou && st.energy >= 5) {
      sandbox.thankForMaterialGift();
      actionsTaken++;
      acted = true;
      continue;
    }

    // ------------------------------------------------------------------------
    // ПРИОРИТЕТ 2: КРИТИЧЕСКАЯ ИНФРАСТРУКТУРА «ЗООШАНСА» И ФИНОТЧЕТЫ
    // ------------------------------------------------------------------------
    // 2.1. Подача заявления в Колл-центр (для скидки 20%, клетки, талона и смеси)
    if (botProfile.submitZooshansApp && !z.applicationSubmitted) {
      const appBtn = findBtn(zooBtns, b => b.title.includes('Заявление в Колл-центр'));
      if (appBtn) {
        appBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 2.2. Переключение режима клиники (талон в долг при нехватке наличных или для дорогих процедур)
    if (z.applicationSubmitted && botProfile.preferVoucherClinic) {
      const needVoucher = st.cash < 180 || (a.hiddenState && a.hiddenState.hasSevereTrauma && !a.traumaOperated);
      if (needVoucher && !z.voucherBlocked && z.voucherDebt < 850 && z.clinicMode !== 'major_voucher') {
        sandbox.selectClinicMode('major_voucher');
      } else if (!needVoucher && st.cash >= 300 && z.clinicMode !== 'partner_cash') {
        sandbox.selectClinicMode('partner_cash');
      }
    }

    // 2.3. Обязательный 7-дневный финотчет (при daysSinceLastFinReport >= 5)
    if (z.personalFundraiserActive && z.daysSinceLastFinReport >= 5) {
      const finBtn = findBtn(zooBtns, b => b.title.includes('7-дневный финотчет'));
      if (finBtn) {
        finBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 2.4. Закупка корма при критическом остатке (<= 2 дня)
    const totalFood = (st.supplies.daysLeft || 0) + (z.giftedFoodDaysLeft || 0);
    if (nActive > 0 && !(st.newborn.active && sandbox.isAnimalAtPlayerHome()) && totalFood <= 2) {
      // Если денег нет, но есть свой кот — одолжить корм у своего кота
      const shareCatBtn = findBtn(careBtns, b => b.title.includes('Занять корм у своего кота'));
      if (shareCatBtn && st.cash < 65) {
        shareCatBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
      const foodBtn = findBtn(careBtns, b => b.title.includes('Запас корма'));
      if (foodBtn) {
        foodBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 2.5. Открытие официального сбора на р/с «Зоошанса» (если доступен и еще не открыт)
    if (!z.officialFundraiserActive) {
      const rsBtn = findBtn(zooBtns, b => b.title.includes('Сбор на р/с'));
      if (rsBtn) {
        rsBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 2.6. Открытие сбора на личную карту при нехватке средств или высоком долге
    const needsMoney = st.cash < 160 || z.voucherDebt > 250 || botProfile.alwaysOpenCardFundraiser || (a.hiddenState && a.hiddenState.hasSevereTrauma);
    if (needsMoney && !z.personalFundraiserActive && !z.personalDonationsBanned && z.personalCardCollectedBYN < 6400) {
      const cardBtn = findBtn(zooBtns, b => b.title.includes('Сбор на личную карту'));
      if (cardBtn) {
        cardBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 2.7. Закрытие сбора на личную карту, если денег много и долгов нет (чтобы не тратить -20⚡ на отчеты)
    if (!botProfile.alwaysOpenCardFundraiser && z.personalFundraiserActive && st.cash > 750 && z.voucherDebt === 0) {
      const closeCardBtn = findBtn(zooBtns, b => b.title.includes('Закрыть сбор на карту'));
      if (closeCardBtn) {
        closeCardBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // ------------------------------------------------------------------------
    // ПРИОРИТЕТ 3: ЖИЗНЕСПАСАЮЩАЯ И ПЛАНОВАЯ ВЕТЕРИНАРИЯ
    // ------------------------------------------------------------------------
    // 3.1. Согласование и проведение экстренной операции / остеосинтеза
    const surgeryBtn = findBtn(vetBtns, b => b.title.includes('Согласование операции') || b.title.includes('Остеосинтез и реанимация'));
    if (surgeryBtn) {
      surgeryBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 3.2. Первичный осмотр и просвет Вуда
    const woodBtn = findBtn(vetBtns, b => b.title.includes('Первичный осмотр'));
    if (woodBtn) {
      woodBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 3.3. Волонтерская барахолка перед покупкой таблеток/шлейки (для Опытного бота)
    const needsSuppliesOrPills = (a.dewormStage < 2 && !z.hasGiftedDewormPill) ||
                                 (a.species === 'dog' && !a.hasAntiEscapeHarness) ||
                                 a.knownRingworm === true;
    if (botProfile.useBarakholka && needsSuppliesOrPills && !st._barakholkaUsedDay && st.energy >= 25) {
      const barBtn = findBtn(zooBtns, b => b.title.includes('Волонтерская барахолка'));
      if (barBtn) {
        st._barakholkaUsedDay = st.day;
        barBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 3.4. Вакцинация своего непривитого домашнего кота (защита от штрафа -215 BYN и -30% менталки)
    if (botProfile.id === 'expert') {
      const ownCatVacBtn = findBtn(vetBtns, b => b.title.includes('Вакцинация домашнего кота'));
      if (ownCatVacBtn && st.cash >= 110) {
        ownCatVacBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 3.5. Защита собаки от клещей и шлейка-антипобег (до 4-го дня!)
    if (a.species === 'dog' && (botProfile.buyHarnessOrTicksProactively || st.day >= 3)) {
      const harnessBtn = findBtn(careBtns, b => b.title.includes('Шлейка-антипобег'));
      if (harnessBtn && st.cash >= 60) {
        harnessBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
      const tickBtn = findBtn(vetBtns, b => b.title.includes('Капли от иксодовых клещей'));
      if (tickBtn && st.cash >= 35) {
        tickBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 3.6. 1-я и 2-я обработка от паразитов (глистогонка)
    const dewormBtn = findBtn(vetBtns, b => b.title.includes('обработка от паразитов'));
    if (dewormBtn) {
      dewormBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 3.7. Экстренная или плановая стерилизация / кастрация
    const spayBtn = findBtn(vetBtns, b => b.title.includes('стерилизация') || b.title.includes('Стерилизация') || b.title.includes('Кастрация'));
    if (spayBtn) {
      spayBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 3.8. Комплексная вакцинация подопечного
    const vacBtn = findBtn(vetBtns, b => b.title.includes('Комплексная вакцинация'));
    if (vacBtn) {
      vacBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 3.9. Специфические медицинские протоколы (ЖКТ Ронидазол, Стоматология, FeLV-терапия, ПЦР)
    const specMedBtn = findBtn(vetBtns, b =>
      b.title.includes('Курс Ронидазола') ||
      b.title.includes('Стоматологическая санация') ||
      b.title.includes('Подтверждающий тест FeLV') ||
      b.title.includes('Консультация инфекциониста')
    );
    if (specMedBtn) {
      specMedBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // ПЦР-профиль
    const pcrBtn = findBtn(vetBtns, b => b.title.includes('ПЦР'));
    if (pcrBtn) {
      const hasSymptomsOrRisk = a.hiddenState.hasChronicGI || a.hiddenState.chronicCarrier || a.hiddenState.deadlyVirus || a.health < 80;
      if (botProfile.doPcrWithoutSymptoms || hasSymptomsOrRisk) {
        pcrBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // Прием узкого специалиста при просадке здоровья
    if (a.health < 72) {
      const docBtn = findBtn(vetBtns, b => b.title.includes('Прием узкого специалиста'));
      if (docBtn) {
        docBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // ------------------------------------------------------------------------
    // ПРИОРИТЕТ 4: БЫТ, ПЕРЕДЕРЖКА, ФОТОСЕССИИ И СИСТЕМНЫЙ ПИАР
    // ------------------------------------------------------------------------
    // 4.1. Связь с семьей по ранней брони (когда питомец готов к переезду)
    const earlyBookBtn = findBtn(careBtns, b => b.title.includes('Семья по ранней брони'));
    if (earlyBookBtn && !sandbox.isAnimalMedicallyRestricted()) {
      earlyBookBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 4.2. Запуск системного пиара и поднятие объявлений каждые 6 дней
    const prBtn = findBtn(careBtns, b =>
      b.title.includes('Системный ПИАР') ||
      b.title.includes('Раннее бронирование') ||
      b.title.includes('ПИАР: малыши без мамы') ||
      b.title.includes('Поднять объявления в топ')
    );
    if (prBtn) {
      prBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 4.3. Фотосессии (Профи-фото Зоошанса x2.6 -> Друзья x1.5 -> Телефон x1.2)
    const proPhotoBtn = findBtn(careBtns, b => b.title.includes('Профи-фото'));
    if (proPhotoBtn) {
      proPhotoBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }
    const homePhotoBtn = findBtn(careBtns, b => b.title.includes('Съемка на телефон') || b.title.includes('Фотосессия с друзьями'));
    if (homePhotoBtn && !z.hasProPhotos) {
      homePhotoBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 4.4. Поиск бесплатной передержки при тяжелом быте, строгой аренде или маневре
    const needFoster = (st.maneuver && st.maneuver.active) ||
                       st.player.housing.id === 'rent_strict' ||
                       st.player.housing.id === 'with_relatives' ||
                       sandbox.calculateDailyHouseholdEnergyDrain() >= 22 ||
                       st.mental < 55;
    if (needFoster && sandbox.isAnimalAtPlayerHome() && !st._fosterSearchedToday && st.energy >= 20) {
      const fosterBtn = findBtn(zooBtns, b => b.title.includes('SOS-пост: Поиск передержки'));
      if (fosterBtn) {
        st._fosterSearchedToday = true;
        fosterBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 4.5. Приучение к лотку/пеленкам и возврат чистой клетки на склад (+8% менталки)
    const toiletOrCageBtn = findBtn(careBtns, b =>
      b.title.includes('Приучение к') || b.title.includes('Сдать клетку на склад')
    );
    if (toiletOrCageBtn && st.cash >= 90 && st.energy >= 25) {
      toiletOrCageBtn.onClick();
      actionsTaken++;
      acted = true;
      continue;
    }

    // 4.6. Погашение долга по талону при истекающем сроке или избытке кэша
    if (z.voucherDebt > 0 && st.cash >= z.voucherDebt && (z.voucherDaysLeft <= 5 || st.cash >= z.voucherDebt + 250)) {
      const payDebtBtn = findBtn(zooBtns, b => b.title.includes('Погасить долг по талону'));
      if (payDebtBtn) {
        payDebtBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 4.7. Мимими-пост со сторителлингом (прокачка пиара, менталки и шанс ранней брони)
    if (botProfile.useStorytelling && st.energy >= 25) {
      const storyBtn = findBtn(zooBtns, b => b.title.includes('Пост со сторителлингом'));
      if (storyBtn) {
        storyBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // 4.8. Запас корма впрок, если денег достаточно
    if (nActive > 0 && totalFood <= 5 && st.cash >= 220 && st.energy >= 20) {
      const foodBtn = findBtn(careBtns, b => b.title.includes('Запас корма'));
      if (foodBtn) {
        foodBtn.onClick();
        actionsTaken++;
        acted = true;
        continue;
      }
    }

    // Если за проход ни одно действие не выбрано — завершаем планирование на сегодня
    if (!acted) break;
  }

  return actionsTaken;
}

// ============================================================================
// 8. ПРОГОН ОДНОЙ ПАРТИИ И СБОР ТЕЛЕМЕТРИИ (AUTOPSY & PACING TRACKER)
// ============================================================================
function simulateSingleRun(sandbox, localStorageStub, scenarioTemplate, botProfile, seed, options = {}) {
  localStorageStub.clear();
  sandbox.Math.random = createSeededRandom(seed);
  const isVerbose = Boolean(options.verbose || CLI.verbose);

  const capturedGrids = {
    tabContent_vet: [],
    tabContent_zooshans: [],
    tabContent_care: []
  };

  let modalsTriggeredToday = 0;

  // Перехват отрисовки кнопок для Zero-Hardcode доступа к актуальным карточкам
  sandbox.renderButtonGrid = function (containerId, buttons) {
    capturedGrids[containerId] = (buttons || []).map(b => {
      const copy = { ...b };
      sandbox.finalizeActionButton(copy);
      return copy;
    });
  };

  // Перехват сюжетных и кризисных модальных окон
  sandbox.showEventModal = function (title, bodyText, choices) {
    modalsTriggeredToday++;
    if (isVerbose) console.log(`   📝 [Событие] "${title}"`);
    resolveEventModalChoice(sandbox, botProfile, title, bodyText, choices, isVerbose);
  };

  // Перехват входящих звонков кандидатов
  sandbox.triggerIncomingCallModal = function (callData, isOldOwnerSearch) {
    modalsTriggeredToday++;
    sandbox.ensureCandidateCallSlots(callData, sandbox.state.animal);
    sandbox.currentCandidateCall = callData;
    callData.slot2Inspected = false;
    callData.slot3Inspected = false;
    callData.photoChecked = false;
    callData.unmasked = false;
    callData.blocked = false;
    if (isVerbose) {
      console.log(`   📞 [Звонок] ${callData.name || 'Кандидат'} (${callData.housing || 'жилье неизвестно'})`);
    }
    resolveCandidateCallModal(sandbox, botProfile, callData, isVerbose);
  };

  // Очищаем визуальные DOM-эффекты и отключаем всплывающие модалки ментора
  sandbox.spawnFloatingResourceBadges = function () {};
  sandbox.updateResourceTooltips = function () {};
  sandbox.showMentorModal = function () {};
  sandbox.fireMentorHint = function () {};
  sandbox.checkMentorTriggers = function () {};
  sandbox.isMentorModalOpen = false;
  sandbox.isMentorArchiveOpen = false;
  sandbox.isScenarioPickerOpen = false;
  sandbox.isAlbumModalOpen = false;
  sandbox.isAnimalModalOpen = false;
  if (typeof sandbox.closeMentorModal === 'function') sandbox.closeMentorModal();

  // Запуск новой партии с выбранным сценарием
  const scenarioClone = JSON.parse(JSON.stringify(scenarioTemplate));
  sandbox.startNewRun(false, scenarioClone, { realPracticeMode: Boolean(options.realPractice) });

  const st = sandbox.state;
  let idleDaysCount = 0;
  let currentIdleStreak = 0;
  let maxIdleStreak = 0;
  let minCash = st.cash;
  let maxCash = st.cash;
  let minMental = st.mental;
  let minHealth = st.animal.health;

  const spiralFlags = {
    secondWindTriggered: false,
    voucherBlockedTriggered: false,
    donationsBannedTriggered: false,
    foodZeroTriggered: false
  };

  let totalTicks = 0;
  const maxTicks = (CLI.maxDays || 250) * 3;

  while (!st.gameOver && st.day < CLI.maxDays && totalTicks < maxTicks) {
    totalTicks++;
    modalsTriggeredToday = 0;
    st._fosterSearchedToday = false;

    const actionsCount = runBotDailyPlanner(sandbox, botProfile, capturedGrids);

    if (st.gameOver) break;

    // Отслеживание темпа (Dead Air / Idle Days)
    if (actionsCount === 0 && modalsTriggeredToday === 0) {
      idleDaysCount++;
      currentIdleStreak++;
      if (currentIdleStreak > maxIdleStreak) maxIdleStreak = currentIdleStreak;
    } else {
      currentIdleStreak = 0;
    }

    if (isVerbose) {
      const a = st.animal;
      console.log(`[День ${String(st.day).padStart(2)}] ⚡ ${st.energy} | 🧠 ${st.mental}% | ❤️ ${a.health}% | 💰 ${st.cash} BYN (Долг: ${st.zooshans.voucherDebt}) | Действий: ${actionsCount}`);
    }

    // Переход на следующий день
    if (st.onboarding && st.onboarding.acutePhase) {
      sandbox.advanceAcuteDay();
    } else {
      sandbox.processDayTick();
    }

    // Обновление метрик и спирали смерти
    if (st.cash < minCash) minCash = st.cash;
    if (st.cash > maxCash) maxCash = st.cash;
    if (st.mental < minMental) minMental = st.mental;
    if (st.animal && st.animal.health < minHealth) minHealth = st.animal.health;

    if (st.secondWindUsed) spiralFlags.secondWindTriggered = true;
    if (st.zooshans && st.zooshans.voucherBlocked) spiralFlags.voucherBlockedTriggered = true;
    if (st.zooshans && st.zooshans.personalDonationsBanned) spiralFlags.donationsBannedTriggered = true;
    if (((st.supplies?.daysLeft || 0) + (st.zooshans?.giftedFoodDaysLeft || 0)) <= 0) {
      spiralFlags.foodZeroTriggered = true;
    }
  }

  // Если превышен лимит дней (Max Days Timeout)
  let outcome = st.victory ? 'victory' : 'defeat';
  let failureReason = st.fatalMistakeReason || (st.victory ? null : 'unknown_defeat');
  if (!st.gameOver && (st.day >= CLI.maxDays || totalTicks >= maxTicks)) {
    outcome = 'timeout';
    failureReason = 'timeout_stagnation';
  }

  return {
    seed,
    scenarioId: scenarioTemplate.id,
    botId: botProfile.id,
    outcome,
    victory: Boolean(st.victory),
    days: st.day,
    failureReason,
    finalCash: st.cash,
    personalMoneySpent: st.personalMoneySpent,
    voucherDebt: st.zooshans ? st.zooshans.voucherDebt : 0,
    cardCollected: st.zooshans ? st.zooshans.personalCardCollectedBYN : 0,
    filteredBadCalls: st.filteredBadCalls || 0,
    minCash,
    maxCash,
    minMental,
    minHealth,
    idleDaysCount,
    maxIdleStreak,
    spiralFlags,
    playerProfile: {
      income: st.player?.income?.id,
      housing: st.player?.housing?.id,
      family: st.player?.family?.id,
      ownPets: st.player?.ownPets?.id,
      mobility: st.player?.mobility?.id,
      socialCapital: st.player?.socialCapital?.id
    },
    startSeason: st.seasonsPassed ? st.seasonsPassed[0] : st.currentSeason
  };
}

// ============================================================================
// 9. АГРЕГАЦИЯ СТАТИСТИКИ И ФОРМИРОВАНИЕ ОТЧЕТА
// ============================================================================
function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor((p / 100) * sortedArr.length)));
  return sortedArr[idx];
}

function aggregateRuns(runs) {
  const total = runs.length;
  if (total === 0) return null;

  const wins = runs.filter(r => r.victory);
  const winRate = +((wins.length / total) * 100).toFixed(1);

  const daysSorted = runs.map(r => r.days).sort((a, b) => a - b);
  const winDaysSorted = wins.map(r => r.days).sort((a, b) => a - b);
  const avgDays = +(runs.reduce((s, r) => s + r.days, 0) / total).toFixed(1);
  const medianWinDays = winDaysSorted.length ? percentile(winDaysSorted, 50) : null;
  const p90WinDays = winDaysSorted.length ? percentile(winDaysSorted, 90) : null;

  const avgSpent = Math.round(runs.reduce((s, r) => s + r.personalMoneySpent, 0) / total);
  const avgFinalCash = Math.round(runs.reduce((s, r) => s + r.finalCash, 0) / total);
  const avgIdleDays = +(runs.reduce((s, r) => s + r.idleDaysCount, 0) / total).toFixed(1);
  const maxIdleStreak = Math.max(...runs.map(r => r.maxIdleStreak));

  const failureBreakdown = {};
  for (const r of runs) {
    if (!r.victory) {
      const reason = r.failureReason || 'health_failure';
      failureBreakdown[reason] = (failureBreakdown[reason] || 0) + 1;
    }
  }

  return {
    totalRuns: total,
    wins: wins.length,
    winRate,
    avgDays,
    medianWinDays,
    p90WinDays,
    avgSpentBYN: avgSpent,
    avgFinalCashBYN: avgFinalCash,
    avgIdleDays,
    maxIdleStreak,
    failureBreakdown
  };
}

// ============================================================================
// 10. ГЛАВНЫЙ КОНВЕЙЕР СИМУЛЯЦИИ
// ============================================================================
function main() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('🐾 ОДИН НА ОДИН: СИМУЛЯТОР СПАСЕНИЯ — СТЕНД АВТОМАТИЧЕСКОЙ БАЛАНСИРОВКИ (v2.3)');
  console.log('================================================================================');

  const sources = loadGameSources(CLI.gameDir);
  const externalJsonData = {
    config: resolveDataJson(CLI.gameDir, 'config.json'),
    playerAxes: resolveDataJson(CLI.gameDir, 'player_axes.json'),
    coats: resolveDataJson(CLI.gameDir, 'coats.json'),
    scenarios: resolveDataJson(CLI.gameDir, 'scenarios.json'),
    calls: resolveDataJson(CLI.gameDir, 'calls.json'),
    petnames: resolveDataJson(CLI.gameDir, 'petnames.json'),
    mentorHints: resolveDataJson(CLI.gameDir, 'mentor_hints.json')
  };

  const { sandbox, localStorageStub } = createGameSandbox(sources, externalJsonData);
  const gameData = sandbox.GAME_DATA;

  // 1. Статический линтер
  const lintResult = runStaticLinter(gameData, sources);
  console.log(`\n🔍 [ЭТАП 1] Статическая валидация сценариев (найдено сценариев: ${lintResult.totalScenarios})`);
  if (lintResult.issues.length > 0) {
    console.error('❌ Критические ошибки схемы:');
    lintResult.issues.forEach(err => console.error(`   - ${err}`));
  } else {
    console.log('✅ Схема всех сценариев и окрасов валидна (0 ошибок).');
  }
  if (lintResult.warnings.length > 0) {
    console.warn('⚠️ Предупреждения линтера флагов:');
    lintResult.warnings.forEach(w => console.warn(`   - ${w}`));
  }

  if (CLI.lintOnly) {
    process.exit(lintResult.issues.length > 0 ? 1 : 0);
  }

  // 1.1. Режим детального пошагового воспроизведения партии (--replay=<seed>)
  if (CLI.replaySeed !== null) {
    const replayBot = (CLI.bot !== 'all' && BOT_PROFILES[CLI.bot]) ? BOT_PROFILES[CLI.bot] : BOT_PROFILES.expert;
    const targetScenario = (CLI.scenario !== 'all'
      ? (gameData.scenarios || []).find(s => s.id === CLI.scenario)
      : (gameData.scenarios && gameData.scenarios[0])) || (gameData.scenarios && gameData.scenarios[0]);

    if (!targetScenario) {
      console.error(`❌ Сценарий${CLI.scenario !== 'all' ? ` с id="${CLI.scenario}"` : ''} не найден!`);
      process.exit(1);
    }

    console.log(`\n🎬 [РЕПЛЕЙ] Пошаговое воспроизведение партии:`);
    console.log(`   • Seed: ${CLI.replaySeed} | Сценарий: ${targetScenario.id} (${targetScenario.name || targetScenario.speciesLabel})`);
    console.log(`   • Бот: ${replayBot.name} | Режим «Реальная практика»: ${CLI.realPractice ? 'ВКЛ 🔥' : 'Стандарт'}\n`);

    const result = simulateSingleRun(sandbox, localStorageStub, targetScenario, replayBot, CLI.replaySeed, {
      realPractice: CLI.realPractice,
      verbose: true
    });

    console.log('\n================================================================================');
    console.log(`🏁 Результат партии: ${result.victory ? 'ПОБЕДА 🏆' : 'ПОРАЖЕНИЕ 💀'}`);
    console.log(`   • Дней прожито: ${result.days}`);
    console.log(`   • Причина исхода: ${result.failureReason ? result.failureReason : 'Успешное пристройство'}`);
    console.log(`   • Финальный баланс: ${result.finalCash} BYN`);
    console.log(`   • Потрачено личных средств: ${result.personalMoneySpent} BYN`);
    console.log(`   • Долг по гарантийке: ${result.voucherDebt} BYN`);
    console.log(`   • Собрано на карту: ${result.cardCollected} BYN`);
    console.log(`   • Отсеяно опасных звонков: ${result.filteredBadCalls}`);
    console.log('================================================================================');
    return;
  }

  // 2. Инкрементальный кэш для флага --changed
  const cachePath = path.join(CLI.gameDir, CLI.cacheFile);
  let prevCache = { globalHash: '', scenarios: {} };
  if (fs.existsSync(cachePath)) {
    try {
      prevCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {}
  }

  const globalFilesHash = md5(
    JSON.stringify(gameData.config) +
    JSON.stringify(gameData.playerAxes) +
    JSON.stringify(gameData.calls) +
    sources['engine.js'].code +
    sources['events.js'].code +
    sources['actions.js'].code +
    sources['adopters.js'].code
  );

  const globalChanged = prevCache.globalHash !== globalFilesHash;
  let scenariosToRun = gameData.scenarios || [];

  if (CLI.scenario !== 'all') {
    scenariosToRun = scenariosToRun.filter(s => s.id === CLI.scenario);
    if (scenariosToRun.length === 0) {
      console.error(`❌ Сценарий с id="${CLI.scenario}" не найден!`);
      process.exit(1);
    }
  } else if (CLI.changedOnly && !globalChanged) {
    scenariosToRun = scenariosToRun.filter(s => {
      const h = md5(s);
      return !prevCache.scenarios || prevCache.scenarios[s.id]?.hash !== h;
    });
    if (scenariosToRun.length === 0) {
      console.log('✨ Ни один сценарий или глобальный конфиг не изменился с прошлого запуска.');
      return;
    }
    console.log(`⚡ Инкрементальный режим (--changed): прогоняем только измененные сценарии (${scenariosToRun.length} шт.)`);
  }

  const botsToRun = CLI.bot === 'all'
    ? [BOT_PROFILES.naive, BOT_PROFILES.novice, BOT_PROFILES.expert, BOT_PROFILES.greedy]
    : [BOT_PROFILES[CLI.bot] || BOT_PROFILES.expert];

  console.log(`\n🚀 [ЭТАП 2] Запуск симуляции Монте-Карло:`);
  console.log(`   • Сценариев: ${scenariosToRun.length} | Ботов: ${botsToRun.map(b => b.id).join(', ')} | Партий на связку: ${CLI.runs}`);
  console.log(`   • Режим «Реальная практика»: ${CLI.realPractice ? 'ВКЛ 🔥' : 'Стандарт'} | Seed: ${CLI.seed}\n`);

  const allRuns = [];
  const scenarioReports = {};

  for (const sc of scenariosToRun) {
    const tierInfo = classifyScenarioTier(sc);
    scenarioReports[sc.id] = {
      id: sc.id,
      species: sc.species,
      speciesLabel: sc.speciesLabel,
      tier: tierInfo.tier,
      tierLabel: tierInfo.label,
      targetExpertWinRate: tierInfo.targetExpert,
      targetNoviceWinRate: tierInfo.targetNovice,
      bots: {},
      balanceVerdict: 'OK',
      anomalies: []
    };

    for (const bot of botsToRun) {
      const botRuns = [];
      for (let i = 0; i < CLI.runs; i++) {
        const runSeed = (CLI.seed + hashString(`${sc.id}_${bot.id}_${i}`)) >>> 0;
        const result = simulateSingleRun(sandbox, localStorageStub, sc, bot, runSeed, {
          realPractice: CLI.realPractice
        });
        botRuns.push(result);
        allRuns.push(result);
      }
      scenarioReports[sc.id].bots[bot.id] = aggregateRuns(botRuns);
    }

    // Автоматическая оценка баланса сценария
    const expStats = scenarioReports[sc.id].bots.expert;
    const novStats = scenarioReports[sc.id].bots.novice;
    const naiStats = scenarioReports[sc.id].bots.naive;

    if (expStats) {
      const [minExp, maxExp] = tierInfo.targetExpert;
      if (expStats.winRate < minExp) {
        scenarioReports[sc.id].balanceVerdict = 'TOO_HARD';
        scenarioReports[sc.id].anomalies.push(
          `Винрейт Опытного бота (${expStats.winRate}%) ниже целевого порога ${minExp}% для ${tierInfo.tier}`
        );
      } else if (expStats.winRate > maxExp && novStats && novStats.winRate > tierInfo.targetNovice[1]) {
        scenarioReports[sc.id].balanceVerdict = 'TOO_EASY';
        scenarioReports[sc.id].anomalies.push(
          `Сценарий слишком легкий: Новичок=${novStats.winRate}%, Опытный=${expStats.winRate}%`
        );
      }
      if (expStats.maxIdleStreak >= 25) {
        scenarioReports[sc.id].anomalies.push(
          `Просадка темпа (Dead Air): до ${expStats.maxIdleStreak} пустых дней подряд без событий`
        );
      }
    }
    if (naiStats && naiStats.winRate > 35) {
      scenarioReports[sc.id].anomalies.push(
        `Наивный бот выигрывает слишком часто (${naiStats.winRate}%) — слабая фильтрация ошибок`
      );
    }
  }

  // 3. Вывод сводной таблицы по сценариям в консоль
  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log(
    'СЦЕНАРИЙ'.padEnd(32) +
    'ТИР'.padEnd(20) +
    'НАИВНЫЙ'.padEnd(11) +
    'НОВИЧОК'.padEnd(11) +
    'ОПЫТНЫЙ'.padEnd(11) +
    'ДНИ (Med)'.padEnd(11) +
    'БЮДЖЕТ'.padEnd(11) +
    'ВЕРДИКТ'
  );
  console.log('------------------------------------------------------------------------------------------------------------------------');

  for (const scId of Object.keys(scenarioReports)) {
    const rep = scenarioReports[scId];
    const nai = rep.bots.naive ? `${rep.bots.naive.winRate}%` : '—';
    const nov = rep.bots.novice ? `${rep.bots.novice.winRate}%` : '—';
    const exp = rep.bots.expert ? `${rep.bots.expert.winRate}%` : '—';
    const medDays = rep.bots.expert?.medianWinDays ? `${rep.bots.expert.medianWinDays} дн.` : (rep.bots.novice?.medianWinDays ? `${rep.bots.novice.medianWinDays} дн.` : '—');
    const spent = rep.bots.expert ? `${rep.bots.expert.avgSpentBYN} BYN` : '—';

    let verdictBadge = '✅ В БАЛАНСЕ';
    if (rep.balanceVerdict === 'TOO_HARD') verdictBadge = '❌ СЛИШКОМ СЛОЖНО';
    else if (rep.balanceVerdict === 'TOO_EASY') verdictBadge = '⚠️ СЛИШКОМ ЛЕГКО';
    else if (rep.anomalies.length > 0) verdictBadge = '⚠️ ЕСТЬ ЗАМЕЧАНИЯ';

    console.log(
      scId.slice(0, 30).padEnd(32) +
      rep.tierLabel.slice(0, 18).padEnd(20) +
      nai.padEnd(11) +
      nov.padEnd(11) +
      exp.padEnd(11) +
      String(medDays).padEnd(11) +
      spent.padEnd(11) +
      verdictBadge
    );
  }
  console.log('------------------------------------------------------------------------------------------------------------------------');

  // 4. Анализ уязвимости осей профиля игрока (по данным Опытного и Новичка)
  const coreRuns = allRuns.filter(r => r.botId === 'expert' || r.botId === 'novice');
  const axisStats = {};
  const axesToCheck = ['income', 'housing', 'family', 'ownPets', 'mobility', 'socialCapital'];

  for (const ax of axesToCheck) {
    axisStats[ax] = {};
    for (const r of coreRuns) {
      const val = r.playerProfile[ax] || 'unknown';
      if (!axisStats[ax][val]) axisStats[ax][val] = { runs: 0, wins: 0 };
      axisStats[ax][val].runs++;
      if (r.victory) axisStats[ax][val].wins++;
    }
    for (const val of Object.keys(axisStats[ax])) {
      const item = axisStats[ax][val];
      item.winRate = +((item.wins / item.runs) * 100).toFixed(1);
    }
  }

  // 5. Анализ «Спирали смерти» (Point of No Return)
  const spiralStats = {
    secondWindUsed: { triggered: 0, winsAfter: 0 },
    voucherBlocked: { triggered: 0, winsAfter: 0 },
    donationsBanned: { triggered: 0, winsAfter: 0 },
    foodZero: { triggered: 0, winsAfter: 0 }
  };

  for (const r of coreRuns) {
    if (r.spiralFlags.secondWindTriggered) {
      spiralStats.secondWindUsed.triggered++;
      if (r.victory) spiralStats.secondWindUsed.winsAfter++;
    }
    if (r.spiralFlags.voucherBlockedTriggered) {
      spiralStats.voucherBlocked.triggered++;
      if (r.victory) spiralStats.voucherBlocked.winsAfter++;
    }
    if (r.spiralFlags.donationsBannedTriggered) {
      spiralStats.donationsBanned.triggered++;
      if (r.victory) spiralStats.donationsBanned.winsAfter++;
    }
    if (r.spiralFlags.foodZeroTriggered) {
      spiralStats.foodZero.triggered++;
      if (r.victory) spiralStats.foodZero.winsAfter++;
    }
  }

  // 6. Топ причин поражений по всем ботам
  const globalFailures = {};
  for (const r of allRuns) {
    if (!r.victory) {
      const reason = r.failureReason || 'health_failure';
      globalFailures[reason] = (globalFailures[reason] || 0) + 1;
    }
  }

  console.log('\n📊 [ЭТАП 3] Топ причин поражений (Fatal Mistake Breakdown):');
  const sortedFailures = Object.entries(globalFailures).sort((a, b) => b[1] - a[1]);
  for (const [reason, count] of sortedFailures.slice(0, 10)) {
    const pct = ((count / allRuns.length) * 100).toFixed(1);
    console.log(`   • ${reason.padEnd(28)}: ${String(count).padStart(5)} партий (${pct}%)`);
  }

  console.log('\n🧬 [ЭТАП 4] Влияние осей профиля игрока на винрейт (Новичок + Опытный):');
  for (const ax of axesToCheck) {
    const parts = Object.entries(axisStats[ax])
      .map(([k, v]) => `${k}: ${v.winRate}%`)
      .join(' | ');
    console.log(`   • ${ax.padEnd(15)} -> ${parts}`);
  }

  // Вывод обнаруженных аномалий баланса
  const allAnomalies = [];
  for (const scId of Object.keys(scenarioReports)) {
    for (const anom of scenarioReports[scId].anomalies) {
      allAnomalies.push(`[${scId}] ${anom}`);
    }
  }

  if (allAnomalies.length > 0) {
    console.log('\n⚠️ [ЭТАП 5] Рекомендации и выявленные аномалии баланса:');
    allAnomalies.forEach(a => console.log(`   🔸 ${a}`));
  } else {
    console.log('\n✅ [ЭТАП 5] Все проверенные сценарии находятся в пределах целевых коридоров баланса!');
  }

  // Сохранение кэша и полного JSON-отчета
  const newCache = {
    updatedAt: new Date().toISOString(),
    globalHash: globalFilesHash,
    scenarios: { ...(prevCache.scenarios || {}) }
  };
  for (const sc of scenariosToRun) {
    newCache.scenarios[sc.id] = {
      hash: md5(sc),
      report: scenarioReports[sc.id]
    };
  }
  try {
    fs.writeFileSync(cachePath, JSON.stringify(newCache, null, 2), 'utf8');
  } catch (e) {}

  const elapsedMs = Date.now() - startTime;
  const fullReport = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalRunsSimulated: allRuns.length,
      runsPerBotPerScenario: CLI.runs,
      realPracticeMode: CLI.realPractice,
      baseSeed: CLI.seed,
      elapsedMs
    },
    linter: lintResult,
    scenarios: scenarioReports,
    playerAxesImpact: axisStats,
    deathSpiralAnalysis: spiralStats,
    globalFailureBreakdown: globalFailures,
    anomalies: allAnomalies
  };

  const outPath = path.resolve(CLI.gameDir, CLI.outJson);
  fs.writeFileSync(outPath, JSON.stringify(fullReport, null, 2), 'utf8');

  console.log(`\n💾 Детальный отчет сохранен в: ${outPath}`);
  console.log(`⏱️ Выполнено ${allRuns.length} полных симуляций за ${(elapsedMs / 1000).toFixed(2)} сек.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  createSeededRandom,
  classifyScenarioTier,
  BOT_PROFILES,
  simulateSingleRun,
  createGameSandbox,
  resolveDataJson,
  loadGameSources,
  runStaticLinter
};
