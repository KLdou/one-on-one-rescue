# Техническая спецификация: Автономная система балансировки и симуляции (Balance Bot & Telemetry Suite)

**Проект:** «Один на один: Симулятор спасения» (v2.2 / v2.3 «Реальная практика»)

**Назначение:** Автоматизированное тестирование методом Монте-Карло, поиск софтлоков, экономический аудит и верификация новых сценариев без участия человека и без запуска браузера (Zero-DOM Headless Runner).

## Оглавление

 1. [Архитектурная концепция и цели](#1-архитектурная-концепция-и-цели)

 2. [Устройство Headless-раннера (Zero-DOM Environment)](#2-устройство-headless-раннера-zero-dom-environment)

 3. [Перехват динамического UI и модальных окон (Hooks & Interceptors)](#3-перехват-динамического-ui-и-модальных-окон-hooks--interceptors)

 4. [Детерминированный генератор случайных чисел (Seeded PRNG)](#4-детерминированный-генератор-случайных-чисел-seeded-prng)

 5. [Декларативный ИИ ботов: 4 архетипа поведения (Zero-Hardcode AI)](#5-декларативный-ии-ботов-4-архетипа-поведения-zero-hardcode-ai)

 6. [Автоматическая поддержка новых сценариев (Zero-Config Extensibility)](#6-автоматическая-поддержка-новых-сценариев-zero-config-extensibility)

 7. [Система телеметрии, метрик и посмертного анализа (Autopsy & Analytics)](#7-система-телеметрии-метрик-и-посмертного-анализа-autopsy--analytics)

 8. [Матрица прогонов и поиск параметров (Grid Search & Sensitivity)](#8-матрица-прогонов-и-поиск-параметров-grid-search--sensitivity)

 9. [Инкрементальный кэш и CI/CD интеграция](#9-инкрементальный-кэш-и-cicd-интеграция)

10. [Спецификация CLI и форматы выходных отчетов](#10-спецификация-cli-и-форматы-выходных-отчетов)

## 1. Архитектурная концепция и цели

Игра представляет собой сложную стохастическую систему с 4 основными ресурсами (`cash` в BYN, `energy` $\⚡$, `mental` $\🧠$, `animal.health` $\❤️$), 6 осями генерации профиля игрока ($3 \times 3 \times 3 \times 3 \times 2 \times 3 = 486$ комбинаций), 4 сезонами, 19+ сценариями подопечных и десятками случайных триггеров.

Ручное тестирование не позволяет:

* Увидеть редкие летальные комбинации («черных лебедей»), возникающие на пересечении бедного профиля (`low` — 280 BYN), наличия непривитого кота (`unvaccinated_cat`) и тяжелого вирусного сценария (`ginger_kitten_trojan_horse`).

* Оценить математическое ожидание длительности партии (`statDays`) для непопулярных окрасов (`cow` — $0.22\text{x}$) в летний сезон («Сезон котят» — $-75\%$ звонков).

* Мгновенно проверить баланс при добавлении 20-го сценария в `data/scenarios.json` или изменении цен в `data/config.json`.

### Главные принципы архитектуры бота:

1. **Zero-Browser / In-Memory Execution:** Никаких Playwright, Puppeteer или JSDOM. Игровые файлы (`data_loader.js`, `state.js`, `engine.js`, `events.js`, `actions.js`, `adopters.js`, `ui.js`) загружаются напрямую в память Node.js. Скорость симуляции — **от 1 500 до 4 000 полных партий в секунду** на одном ядре CPU.

2. **Single Source of Truth (Единый источник истины):** Бот никогда не дублирует формулы, цены или условия из игры. Он считывает доступные кнопки напрямую из функции `renderActionTabs()` файла `ui.js` и нажимает их колбэки `onClick()`. Если в `ui.js` изменилась цена вакцинации с 60 BYN на 75 BYN, бот автоматически узнает об этом из объекта карточки.

3. **Zero-Hardcode Scenario Support:** В коде бота запрещено использовать конструкции вида `if (state.animal.id === 'severe_trauma_sheri_dog')`. Бот анализирует исключительно симптомы, флаги состояния `state` и доступные карточки действий.

## 2. Устройство Headless-раннера (Zero-DOM Environment)

Поскольку клиентский код игры обращается к `window`, `document`, `localStorage` и `navigator`, раннер создает легковесную заглушку (Mock Environment) перед загрузкой игровых скриптов через встроенный модуль `vm` или глобальный контекст Node.js.

### 2.1. Схема заглушки DOM и Browser API

```
// Концептуальная схема инициализации окружения в balance_bot.js
const mockElements = new Map();

function createMockElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    value: '',
    disabled: false,
    checked: false,
    style: {},
    dataset: {},
    className: '',
    classList: {
      _classes: new Set(['hidden']), // По умолчанию модалки скрыты
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c); }
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {}
  };
}

global.window = global;
global.document = {
  body: createMockElement('body'),
  getElementById(id) {
    if (!mockElements.has(id)) mockElements.set(id, createMockElement(id));
    return mockElements.get(id);
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  addEventListener: () => {}
};

// Изолированный in-memory localStorage для тестирования мета-прогрессии (Альбом и Памятка)
const memoryStorage = new Map();
global.localStorage = {
  getItem: (k) => memoryStorage.has(k) ? memoryStorage.get(k) : null,
  setItem: (k, v) => memoryStorage.set(k, String(v)),
  removeItem: (k) => memoryStorage.delete(k),
  clear: () => memoryStorage.clear()
};

```

### 2.2. Отключение визуального рендеринга для ускорения CPU

Функции чистого отображения, которые формируют длинные строки HTML и SVG (`buildPetSVG`, `renderLog`, `updateResourceTooltips`, `spawnFloatingResourceBadges`, `renderHUD`, `renderTopBar`), в режиме симуляции заменяются на пустые функции (`noop`), **кроме** `renderActionTabs()`.

Функция `renderActionTabs()` обязательно выполняется на каждом шаге бота, так как именно она вычисляет доступность действий (`active`, `locked`, `insufficient`, `cooldown`, `completed`) во вкладках «1. Клиника», «2. Зоошанс» и «3. Быт и Пиар».

## 3. Перехват динамического UI и модальных окон (Hooks & Interceptors)

В игре взаимодействие с игроком происходит через 4 канала:

1. Карточки в 3 основных вкладках (`tabContent_vet`, `tabContent_zooshans`, `tabContent_care`).

2. Экстренные верхние баннеры (выкорм слепышей `newbornUrgentBanner`, поиск беглеца `escapeUrgentBanner`, благодарность за подарок `giftThankYouBanner`).

3. Сюжетные и кризисные модальные окна (`showEventModal(title, bodyText, choices)`).

4. Окно собеседования со звонящим кандидатом (`triggerIncomingCallModal(callData, isOldOwnerSearch)`).

### 3.1. Перехватчик карточек вкладок (`renderButtonGrid`)

В `ui.js` функция `renderButtonGrid(containerId, buttons)` принимает массив объектов кнопок и вызывает для каждой `finalizeActionButton(b)`, которая проставляет актуальный `b.state` (`'active'`, `'insufficient'`, `'locked'`, `'cooldown'`, `'completed'`).

Бот переопределяет `renderButtonGrid`:

```
global.botActionRegistry = {
  tabContent_vet: [],
  tabContent_zooshans: [],
  tabContent_care: []
};

global.renderButtonGrid = function(containerId, buttons) {
  buttons.forEach(b => finalizeActionButton(b));
  global.botActionRegistry[containerId] = buttons;
};

```

Теперь бот в любой момент видит все карточки всех трех вкладок со всеми рассчитанными ценами (`costBYN`, `costEnergy`), флагами талона (`isVoucherPay`) и статусами, и может выполнить действие простым вызовом `button.onClick()`.

### 3.2. Перехватчик событийных модалок (`showEventModal`)

Когда в `engine.js` или `events.js` случается ЧП (например, вспышка панлейкопении, визит хозяина квартиры на 9-й день, возврат с испытательного срока или 1-й день онбординга), вызывается `showEventModal(title, bodyText, choices)`.

В Headless-режиме `showEventModal` перехватывается синхронно:

1. Фиксирует факт появления события в телеметрии партии.

2. Передает `{ title, bodyText, choices }` текущему профилю бота (`currentBotPolicy.resolveEventModal(title, bodyText, choices, state)`).

3. Бот выбирает один из элементов массива `choices` и немедленно вызывает `chosenOption.action()`.

### 3.3. Перехватчик звонков «ручек» (`triggerIncomingCallModal`)

Когда в `adopters.js` срабатывает звонок кандидата или мошенника, вызывается `triggerIncomingCallModal(callData, isOldOwnerSearch)`.
Перехватчик передает `callData` в метод бота `currentBotPolicy.resolveCandidateCall(callData, isOldOwnerSearch, state)`:

* Бот решает, тратить ли энергию на открытие Слота 2 (`actionInspectCandidateSlot(2)`, $-2\⚡$) и Слота 3 (`actionInspectCandidateSlot(3)`, $-2\⚡$).

* В режиме «Реальная практика» (`state.realPracticeMode === true`) бот решает, запрашивать ли фото окон и условий (`actionRequestPhotoCheck()`, $-20\⚡$).

* На основе открытых флагов (`green`, `yellow`, `red`, `unmasked`) бот вызывает либо `actionRefuseCandidate()`, либо `actionAcceptCandidate(isPair, options)`.

## 4. Детерминированный генератор случайных чисел (Seeded PRNG)

Для того чтобы любую провальную партию можно было воспроизвести пошагово с точностью до одного дня и одного рубля, стандартный `Math.random` заменяется на быстрый 32-битный детерминированный алгоритм **Mulberry32**.

```
function createMulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

```

### Преимущества для балансировки (A/B Регрессия):

* Каждому прогону присваивается уникальный `runSeed` (например, `100001..110000`).

* Если в отчете видно, что `runSeed: 104512` (Сценарий: `orphan_puppies_litter`, Профиль: `low` + `no_car`) завершился поражением на 6-й день от парвовируса (`virus_no_icu`), разработчик запускает команду:
  `node balance_bot.js --replay 104512 --verbose`

* Консоль выводит подробный дневник именно этой партии день за днем.

* После правки константы в `config.json` повторный запуск `--replay 104512` покажет, выжил ли помет щенков при тех же самых бросках кубика.

## 5. Декларативный ИИ ботов: 4 архетипа поведения (Zero-Hardcode AI)

Для проверки «вилки скилла» (Skill Floor vs Skill Ceiling) система включает 4 стратегии принятия решений. Ни одна из них не привязана к конкретным ID животных.

### 5.1. Матрица архетипов ботов

| Параметр стратегии | 1\. `naive` (Наивный обыватель) | 2\. `novice` (Рациональный новичок) | 3\. `expert` (Опытный куратор) | 4\. `greedy` (Стресс-абузер экономики) | 
| ----- | ----- | ----- | ----- | ----- | 
| **Выбор в 1-й день** | Случайный (вкл. риск Гурского / коробки, если не отключено флагом) | Сразу в клинику или Гугл | Пропуск онбординга / Сразу в клинику | Сразу в клинику | 
| **Заявление в «Зоошанс»** | Игнорирует (лечит по полной цене, без клетки) | Подает на 2–3 день | Подает в 1-й же день (приоритет №1) | Подает в 1-й день, переключает всё на Ветцентр Б (в долг) | 
| **Барахолка `@zooshans_chat`** | Не использует | Использует редко (при `cash < 50`) | Использует по КД при нужде в шлейке, лекарствах или корме | Спамит каждый день ради бесплатных ресурсов | 
| **Сторителлинг и Сборы** | Не ведет | Открывает сбор только при долге $>300$ BYN | Открывает сбор на карту со старта, пишет мимими-посты при $\⚡ > 45$ | Держит все сборы открытыми, тестирует потолок 6500 BYN | 
| **Контроль финотчета (7 дн.)** | Пропускает (получает бан сборов и $-35\% \🧠$) | Публикует при остатке $\le 2$ дн. | Публикует строго при остатке $\le 2$ дн. (резервирует $20\⚡$) | Публикует в последний день | 
| **Проверка «ручек»** | Отдает первому позвонившему без проверки слотов | Открывает Слот 2 и 3 ($-4\⚡$), отсеивает явный `red`, берет `yellow` без поддержки | Открывает Слоты 2 и 3, делает фото-проверку ($-20\⚡$) в Реальной практике, берет `yellow` только с сопровождением ($-15\⚡$) | Отдает первым `green` или `yellow` без брони передержки | 
| **Целевой Winrate (Норма)** | **0% – 5%** | **40% – 55%** | **80% – 92%** | **Индикатор эксплойтов** | 

### 5.2. Универсальный цикл хода бота (`runBotDailyTurn`)

Каждый игровой день (до вызова `processDayTick()`) бот оценивает обстановку и выполняет действия в цикле `while (actionTaken && safetyCounter < 20)`, пока у него есть энергия и деньги.

Все доступные действия ранжируются по **7-уровневой пирамиде приоритетов (Utility Scoring)**:

#### Уровень 0: Экстренное выживание (Critical Survival)

1. **Выкорм слепышей дома:** Если `state.newborn.active && isAnimalAtPlayerHome() && !state.newborn.fedToday`:

   * Если `!state.newborn.knowsAboutFormula` $\rightarrow$ вызвать `actionAskZooshansTakeover()` (узнать про смесь и получить стартовый пакет).

   * Если `state.newborn.milkDaysLeft <= 0` и `state.cash >= 105` $\rightarrow$ вызвать `buyBabycatFormula()`.

   * Вызвать `feedNewbornKittens()` ($-15\⚡$).

2. **Поиск беглеца (4 дня):** Если `state.escapeQuest.active && state.escapeQuest.searchProgress < 100`:

   * Нажимать доступные кнопки поиска (`night` $-20\⚡ \rightarrow$ `posters` $-15\⚡ \rightarrow$ `social` $-10\⚡$), пока шкала не достигнет $100\%$ или не кончится энергия.

3. **Голод / Заканчивается корм или смесь на передержке:**

   * Если `totalFood <= 1` (или `milkDaysLeft <= 1` для слепышей на передержке):

     * Проверить возможность бесплатной выручки от своего кота (`actionShareFoodWithOwnCat()`, если `cash < 65`).

     * Иначе купить пакет корма во вкладке `care` или банку смеси (`buyBabycatFormula()`).

#### Уровень 1: Защита от фатальных штрафов и блокировок

1. **Обязательный 7-дневный финотчет:** Если `state.zooshans.personalFundraiserActive && state.zooshans.daysSinceLastFinReport >= 5` $\rightarrow$ нажать карточку «7-дневный финотчет сборов» ($-20\⚡$), чтобы избежать бана карты и потери $-35\% \🧠$.

2. **Фото-благодарность за подарок:** Если `state.zooshans.pendingGiftThankYou` $\rightarrow$ вызвать `thankForMaterialGift()` ($-5\⚡$, $+6\% \🧠$).

3. **Защита от заражения своего непривитого кота:** Если у игрока `ownPets.id === 'unvaccinated_cat'` и подопечный дома на полу (`home_floor`):

   * Опытный бот в 1-й день подает заявление в «Зоошанс» (получает клетку `home_cage`), а при наличии 60 BYN — нажимает «Вакцинация домашнего кота».

#### Уровень 2: Инфраструктура «Зоошанса» и Финансы

1. **Регистрация в Колл-центре:** Если `!state.zooshans.applicationSubmitted` $\rightarrow$ нажать «Заявление в Колл-центр» ($-10\⚡$).

2. **Переключение режима клиники:** Если у бота мало наличных (`state.cash < 120`), заявление подано и талон не заблокирован $\rightarrow$ вызвать `selectClinicMode('major_voucher')`. Если наличных много (`state.cash > 350`), а долг по талону близок к лимиту (`voucherDebt > 700`) $\rightarrow$ переключить на `partner_cash`.

3. **Открытие сборов:**

   * Если доступна карточка «Сбор на р/с Зоошанса» (`state === 'active'` и `!officialFundraiserActive`) $\rightarrow$ открыть.

   * Если `state.cash < 250` или `state.zooshans.voucherDebt > 200`, и сбор на карту еще не открыт (`!personalFundraiserActive`) $\rightarrow$ открыть «Сбор на личную карту» ($-15\⚡$).

#### Уровень 3: Жизнеугрожающая и плановая ветеринария (Вкладка `vet`)

Бот сканирует `botActionRegistry.tabContent_vet` на наличие кнопок со статусом `state === 'active'` в следующем порядке:

1. `Согласование операции` / `Остеосинтез и реанимация` (при тяжелой травме или жизнеугрожающем состоянии).

2. `Экстренная стерилизация` (при `hiddenState.isPregnant === true`, чтобы успеть до 8-го дня родов).

3. `Первичный осмотр и просвет Вуда`.

4. `1-я обработка от паразитов` и `2-я обработка от паразитов`.

5. `Капли от иксодовых клещей` (для собак весной/летом, если не в стационаре) и `Шлейка-антипобег` (во вкладке `care` или через барахолку до 4-го дня).

6. Специфическая терапия: `Курс Ронидазола и гастро-диета`, `Стоматологическая санация`, `ПЦР-профиль инфекций`, `Подтверждающий тест FeLV`, `Консультация инфекциониста`.

7. `Комплексная вакцинация` (с 60 дней).

8. Плановая `Стерилизация / Кастрация`.

#### Уровень 4: Оптимизация быта и передержки

1. **Передача по ранней брони:** Если во вкладке `care` активна карточка «Семья по ранней брони» и животное не ограничено медицински (`!isAnimalMedicallyRestricted()`) $\rightarrow$ нажать немедленно.

2. **Волонтерская барахолка:** Если нужна шлейка для собаки, таблетки от глистов, капли или мало корма $\rightarrow$ нажать «Волонтерская барахолка» ($-10\⚡$).

3. **Поиск бесплатной передержки:** Если животное дома (`isAnimalAtPlayerHome()`) и отнимает много бытовой энергии (`calculateDailyHouseholdEnergyDrain() >= 20`) или у игрока `rent_strict` / `with_relatives` $\rightarrow$ нажать «SOS-пост: Поиск передержки» ($-15\⚡$).

#### Уровень 5: Пиар и маркетинг (Вкладка `care`)

1. Если `canStartPr` (или животное на этапе подготовки):

   * Сделать `Съемка на телефон` ($-5\⚡$) $\rightarrow$ `Фотосессия с друзьями` ($-8\⚡$) $\rightarrow$ `Профи-фото Зоошанса` ($-15\⚡$, когда карантин 14 дн. пройден).

2. Запустить `Системный ПИАР` ($-12\⚡$) или `Поднять объявления в топ` ($-10\⚡$, когда `daysSinceAdRefresh >= 6`).

3. Если еще не приучен к лотку/пеленкам (`!a.litterTrained`) и есть лишние деньги (`cash >= 150`) $\rightarrow$ нажать `Приучение к лотку/пеленкам` ($-26\text{ BYN}, -15\⚡$).

4. Если клетка больше не нужна (`canReturnCage`) $\rightarrow$ нажать `Сдать клетку на склад` ($-16\text{ BYN}, -15\⚡, +8\% \🧠$).

5. Если после всех важных дел осталась свободная энергия ($\⚡ \ge 35$) $\rightarrow$ написать `Пост со сторителлингом` ($-10\⚡$).

## 6. Автоматическая поддержка новых сценариев (Zero-Config Extensibility)

Когда геймдизайнер добавляет новый сценарий в `data/scenarios.json` или новое событие в `data/calls.json`, система обрабатывает их автоматически за счет трех механизмов.

### 6.1. Предварительный статический линтер (`ScenarioSchemaValidator`)

Перед стартом симуляции скрипт проверяет целостность всех JSON-файлов:

1. **Валидация ссылок на окрасы:** Проверяет, что каждый ключ из `allowedCoats` или `coatId` существует в `coats.json` (`catCoats` / `dogCoats`).

2. **Валидация возрастных и количественных рамок:** Проверяет согласованность `ageDays` и `ageCategory` (например, если `ageCategory === 'newborn'`, но `ageDays > 21`, выдается предупреждение: слепыши перерастут соску в первый же тик).

3. **Детектор необрабатываемых флагов (`Orphaned State Flags`):**

   * Скрипт собирает все ключи из `scenario.hiddenState` по всем сценариям.

   * Сверяет их с белым списком поддерживаемых движком механик (`isNewborn`, `ringworm`, `deadlyVirus`, `chronicCarrier`, `isPregnant`, `daysUntilBirth`, `hasSevereTrauma`, `needsBloodDonor`, `isJawFracture`, `syringeDaysLeft`, `isLostOrPurebred`, `isKittenSeason`, `needsSocialization`, `socializationDaysDone`, `hasChronicGI`, `virusIncubationDays`, `ringwormIncubationDays`).

   * Если в новом сценарии обнаружен неизвестный ключ (например, `"hasHeartworm": true`), который нигде не читается в `engine.js` / `events.js` / `ui.js`, линтер выводит ошибку до начала прогонов.

### 6.2. Авто-классификатор тира сложности (`ScenarioTierClassifier`)

Чтобы бот знал, какой винрейт считать нормой для нового сценария, он автоматически вычисляет индекс тяжести сценария ($S_{\text{score}}$) по его стартовым параметрам:

$$
S_{\text{score}} = (\text{count} - 1) \times 12 + I_{\text{newborn}} \times 35 + I_{\text{trauma}} \times 40 + I_{\text{deadlyVirus}} \times 35 + I_{\text{ringworm}} \times 20 + I_{\text{pregnant}} \times 25 + I_{\text{carrier}} \times 20 + I_{\text{dog}} \times 15 + (1 - \text{popularity}) \times 15
$$

На основе $S_{\text{score}}$ сценарию автоматически присваивается один из 3 тиров:

* **Tier 1 — Стандартный (**$S_{\text{score}} < 25$**):** Целевой винрейт `expert`: **85% – 96%**, `novice`: **55% – 75%**.

* **Tier 2 — Осложненный (**$25 \le S_{\text{score}} < 50$**):** Целевой винрейт `expert`: **70% – 88%**, `novice`: **30% – 55%**.

* **Tier 3 — Экстремальный / Реанимация (**$S_{\text{score}} \ge 50$**):** Целевой винрейт `expert`: **50% – 78%**, `novice`: **10% – 30%**.

Если новый сценарий показывает винрейт ниже нижней границы своего тира (например, `expert` выигрывает лишь в 25% партий), он помечается статусом `🔴 UNDERTUNED / TOO HARD`. Если `novice` выигрывает в 95% партий в Tier 3 — `🟡 OVERTUNED / TOO EASY`.

### 6.3. Эвристический парсер незнакомых модальных окон

Если в игру добавлено новое текстовое событие через `showEventModal(title, bodyText, choices)`, о котором бот не знает:

1. Бот анализирует поле `c.style` у каждой кнопки: приоритет отдается `'primary'`, затем `'info'`, затем `'secondary'`. Варианты со стилем `'danger'` отбрасываются (кроме случая, когда это единственная кнопка закрытия окна).

2. Если кнопок с `'primary'` или `'info'` несколько, бот парсит регулярным выражением `(/\(-?(\d+)\s*BYN/i)` и `(/\(-?(\d+)\s*⚡/i)` стоимость из текста `c.label`.

3. Если у бота достаточно `state.cash` и `state.energy` для оплаты `primary`-варианта — он выбирает его; если ресурсов не хватает — выбирает резервный вариант без фатального тега.

## 7. Система телеметрии, метрик и посмертного анализа (Autopsy & Analytics)

Каждый завершенный прогон возвращает структурированный объект `RunTelemetry`:

```
{
  "runId": 1042,
  "seed": 9841204,
  "botPolicy": "expert",
  "realPracticeMode": true,
  "scenarioId": "ginger_kitten_trojan_horse",
  "scenarioTier": 3,
  "playerProfile": {
    "income": "low",
    "housing": "rent_strict",
    "family": "small_kids",
    "ownPets": "unvaccinated_cat",
    "mobility": "no_car",
    "socialCapital": "introvert"
  },
  "startSeason": "summer",
  "outcome": {
    "victory": false,
    "daysSurvived": 5,
    "fatalMistakeReason": "burnout",
    "autopsy": {
      "cashAtDeath": 44,
      "energyAtDeath": 12,
      "mentalAtDeath": 0,
      "healthAtDeath": 45,
      "voucherDebtAtDeath": 336,
      "voucherBlocked": false,
      "secondWindUsedOnDay": 4,
      "lastCriticalEvents": [
        "День 4: ЖИЗНЕУГРОЖАЮЩЕЕ СОСТОЯНИЕ: Панлейкопения (-25% 🧠, капельницы 336 BYN)",
        "День 4: КАТАСТРОФА КАРАНТИНА: Заразился свой непривитый кот (-215 BYN, -30% 🧠)",
        "День 5: ДИАГНОЗ: Микроспория (Лишай) — паника из-за ребенка 2.5x (-45% 🧠)"
      ]
    }
  },
  "economy": {
    "personalMoneySpent": 236,
    "voucherFundsUsed": 336,
    "personalCardCollected": 65,
    "peakCash": 280,
    "minCash": 21,
    "daysStarving": 0
  },
  "pacing": {
    "totalActionsTaken": 9,
    "idleDaysCount": 0,
    "maxIdleStreak": 0,
    "adopterCallsReceived": 0,
    "badCallsFiltered": 0,
    "trialReturnsCount": 0
  }
}

```

### Ключевые аналитические детекторы:

1. **Autopsy Deficit Detector (Анализ дефицита в момент гибели):**

   * Если причина поражения `virus_no_icu`, `health_failure` или `landlord_eviction_no_vet`, система вычисляет, сколько именно `BYN` или $\⚡$ не хватило боту в этот день для нажатия спасительной кнопки.

   * Выводит агрегированную подсказку: *«В сценарии `ginger_kitten_trojan_horse` при профиле `low` в 68% поражений боту не хватает в среднем 42 BYN наличными на 4-й день»*.

2. **Point of No Return (Точка невозврата):**

   * Вычисляет условную вероятность победы $P(\text{Win} \mid \text{Event})$ после наступления тяжелых событий:

     * Срыв карантина и заражение своего кота (`-215 BYN, -30% 🧠`).

     * Отказ от стационара при вирусе.

     * Вызов «Второго дыхания» (`secondWindUsed = true`).

     * Блокировка личного сбора (`personalDonationsBanned = true`).

   * Если $P(\text{Win} \mid \text{Event}) < 2\%$, значит событие фактически является скрытым Game Over с отложенной агонией игрока.

3. **Pacing & Dead Air Detector (Индекс скуки):**

   * Считает долю «пустых дней» (`idleDaysCount / daysSurvived`) на этапе после 14-го дня карантина.

   * Если в сценарии (например, `adult_cat_in_kitten_season`) медианная длина партии превышает 90 дней, из которых 75 дней игрок только нажимает «Промотать штиль» и раз в 6 дней обновляет пиар, система сигнализирует о затянутости эндгейма.

## 8. Матрица прогонов и поиск параметров (Grid Search & Sensitivity)

Скрипт поддерживает 3 режима формирования выборки:

1. **Random Monte-Carlo (`--mode monte-carlo --runs 5000`):**
   Случайная генерация профилей и сценариев (как в реальной игре, с учетом предохранителя генерации из `state.js`). Показывает «среднюю температуру по больнице».

2. **Full Stratified Matrix (`--mode matrix --runs-per-cell 20`):**
   Принудительно прогоняет каждый из 19+ сценариев по отдельности (передавая `forcedScenario` в `startNewRun(false, scenario)`), равномерно распределяя по ним все уровни дохода (`low`, `mid`, `high`), жилья и сезонов. Гарантирует, что редкие сценарии будут протестированы так же тщательно, как и частые.

3. **Worst-Case Stress Test (`--mode hardcore-stress`):**
   Фиксирует самый тяжелый профиль куратора (`income: low`, `housing: rent_strict`, `family: small_kids`, `ownPets: unvaccinated_cat`, `mobility: no_car`, `socialCapital: introvert`, `realPracticeMode: true`) и проверяет, способен ли `expert`-бот вытянуть каждый сценарий хотя бы в 25–30% случаев (проверка на математическую проходимость).

## 9. Инкрементальный кэш и CI/CD интеграция

Чтобы не ждать полного прогона всех сценариев при редактировании одного животного:

1. Скрипт вычисляет `SHA-256` хэш для:

   * Глобальной экономики и логики (`config.json`, `player_axes.json`, `coats.json`, `calls.json`, `engine.js`, `actions.js`, `events.js`, `adopters.js`, `ui.js`).

   * Каждого отдельного объекта сценария в `scenarios.json`.

2. Хэши и результаты последнего прогона сохраняются в `.balance_cache.json`.

3. При запуске `node balance_bot.js --smart`:

   * Если изменилась глобальная экономика или код движка $\rightarrow$ запускается полный пересчет всех сценариев.

   * Если изменился или добавился только 1 сценарий в `scenarios.json` $\rightarrow$ пересчитывается **только он** (занимает $< 0.5$ сек), а таблица в консоли объединяет его свежие метрики с кэшированными данными остальных сценариев.

## 10. Спецификация CLI и форматы выходных отчетов

### 10.1. Примеры команд запуска

```
# Быстрый умный прогон (проверяет схему + считает только новые/измененные сценарии)
node balance_bot.js --smart

# Полная стратифицированная матрица по всем сценариям (по 200 прогонов на каждый для Novice и Expert)
node balance_bot.js --mode matrix --runs-per-scenario 200 --export balance_report.json

# Проверка конкретного сценария в режиме «Реальная практика»
node balance_bot.js --scenario severe_trauma_sheri_dog --runs 500 --real-practice

# Детальный пошаговый реплей конкретной провальной партии по её зерну (Seed)
node balance_bot.js --replay 9841204 --verbose

```

### 10.2. Пример вывода сводной таблицы в терминал

```
====================================================================================================
🐾 ОТЧЕТ АВТО-БАЛАНСИРОВКИ: ОДИН НА ОДИН (v2.2 / Реальная практика: ON)
Валидация JSON-схемы: ✓ OK (19 сценариев, 0 сиротских флагов) | Время расчета: 2.14 сек (7600 партий)
====================================================================================================
СЦЕНАРИЙ                        ТИР  NOVICE WR  EXPERT WR  СР.ДНЕЙ  СР.ТРАТЫ   ГЛАВНАЯ ПРИЧИНА СМЕРТИ (EXPERT)
----------------------------------------------------------------------------------------------------
healthy_adult_cat_marathon       T1     68.5%      94.0%     34 дн.   210 BYN  burnout (3.5%), window_fall (2.5%)
healthy_popular_kittens          T1     74.0%      96.5%     22 дн.   165 BYN  burnout (2.0%)
adult_cat_in_kitten_season       T2     42.0%      81.5%     64 дн.   390 BYN  burnout (12.0%) [⚠️ Долгий штиль: 38 дн.]
pregnant_stray_cat_timer         T2     38.5%      84.0%     29 дн.   310 BYN  burnout (11.0%)
ginger_kitten_trojan_horse       T3     14.0%      62.5%     41 дн.   540 BYN  icu_virus_fatal (18%), burnout (14%)
severe_trauma_sheri_dog          T3     11.5%      58.0%     68 дн.   680 BYN  icu_trauma_fatal (12%), health (18%)
newborn_blind_kittens            T3      8.0%      66.0%     38 дн.   420 BYN  starvation (19%), burnout (15%)
----------------------------------------------------------------------------------------------------
СРЕДНЕЕ ПО ИГРЕ:                        44.2%      79.8%     42 дн.   385 BYN  Статус баланса: ✅ В НОРМЕ
====================================================================================================

```

```

В этой документации описана полная архитектура бота, который не зависит от жестко прописанных `id` сценариев и берет все действия напрямую из вашего UI-слоя. 

Следующим шагом мы можем написать сам рабочий файл `balance_bot.js` (для запуска через `node balance_bot.js`), который реализует эту спецификацию и сразу прогонит ваши текущие 19 сценариев. Начнем писать код раннера?

```