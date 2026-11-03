# Реактивная система обучения («Совет координатора» и «Разбор полетов») — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать реактивную обучающую систему игрока через превентивные советы координатора и разбор ошибок при наступлении реальных кризисных ситуаций без стартового туториала и без ограничения рандома.

**Architecture:** Выделенный модальный компонент `#mentorModal` с наивысшим приоритетом показа, очередью и остановкой таймера (Timer Guard); мета-прогресс открытых подсказок в `localStorage['zooshans_unlocked_mentor_hints']` (не сбрасывается при новой игре); модальный архив «Памятка куратора» `#mentorArchiveModal` с кнопкой в топ-баре и возможностью сброса прогресса.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3 / Tailwind CSS (CDN), Node.js (test harness). Без внешних библиотек и сборщиков (совместимость с `file://`).

**Spec:** [`docs/superpowers/specs/2026-11-03-reactive-mentor-system-design.md`](file:///d:/projects/volontiers/docs/superpowers/specs/2026-11-03-reactive-mentor-system-design.md)

## Global Constraints
- Strictly BYN currency (все цены, балансы и логи только в BYN, никакого `$`/`USD`).
- Zero-build vanilla compatibility: чистый JavaScript без npm-зависимостей, полная работоспособность локально через `file://`.
- JSON & Fallback Sync: любые изменения в `data/*.json` обязательно синхронизируются с `window.GAME_DATA` в `js/data_loader.js`.
- Timer Guard: открытие модальных окон обязано вызывать `stopTimer()`.
- Изученные карточки сохраняются между партиями и не сбрасываются при `startNewRun()`.

## Review Focus
1. **Сохранение мета-прогресса:** `startNewRun()` не должен очищать `zooshans_unlocked_mentor_hints`.
2. **Очередь и приоритет:** При совпадении с игровым событием совет координатора открывается первым, а игровое окно не теряется.
3. **Отказоустойчивость `file://`:** При открытии игры без веб-сервера подсказки должны загружаться из предзагруженного объекта `window.GAME_DATA.mentorHints`.
4. **Безопасность сброса обучения:** Сброс прогресса в «Памятке» запрашивает подтверждение и мгновенно обновляет счетчик в шапке (на `0/8`).
5. **Предотвращение повторных триггеров:** Подсказка не должна всплывать повторно, если уже есть в `localStorage`.

---

### Task 1: Подготовка данных `mentor_hints.json` и синхронизация в `data_loader.js`

**Files:**
- Create: `game_modular/data/mentor_hints.json`
- Modify: `game_modular/js/data_loader.js:1-30`
- Test: `tests/test_mentor_system.js`

**Interfaces:**
- Consumes: JSON-конфигурация подсказок из спецификации.
- Produces: `window.GAME_DATA.mentorHints` (словарь объектов подсказок по ID).

- [ ] **Step 1: Write test for mentor hints data loading**

```javascript
// tests/test_mentor_system.js
const fs = require('fs');
const assert = require('assert');
const path = require('path');

// Test 1: JSON file exists and contains all 8 required hint IDs
const rawJson = fs.readFileSync(path.resolve(__dirname, '../game_modular/data/mentor_hints.json'), 'utf8');
const hints = JSON.parse(rawJson);
const requiredKeys = [
  'LOW_ENERGY_WARNING',
  'CLINIC_DEBT_HALFWAY',
  'QUARANTINE_BREACH_RISK',
  'REVACCINATION_OVERDUE',
  'STALE_PR_WARNING',
  'FIRST_TRIAL_STARTED',
  'ADOPTION_FAILED_POSTMORTEM',
  'SCAM_VICTIM_POSTMORTEM'
];

requiredKeys.forEach(k => {
  assert(hints[k], `Missing hint key: ${k}`);
  assert(hints[k].id === k, `Mismatch id for ${k}`);
  assert(['advice', 'post_mortem'].includes(hints[k].type), `Invalid type for ${k}`);
  assert(hints[k].title, `Missing title for ${k}`);
  assert(hints[k].message, `Missing message for ${k}`);
  assert(hints[k].rule, `Missing rule for ${k}`);
});
console.log('✓ Task 1: mentor_hints.json structure valid');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_mentor_system.js`  
Expected: FAIL (file `mentor_hints.json` does not exist yet).

- [ ] **Step 3: Create `game_modular/data/mentor_hints.json`**

Создать файл с точным содержимым словаря подсказок из запроса пользователя.

- [ ] **Step 4: Update `game_modular/js/data_loader.js`**

- Добавить загрузку `data/mentor_hints.json` в `loadGameDataAsync()` через `fetch('data/mentor_hints.json').then(r => r.json())`.
- Добавить `mentorHints: hints` в результирующий `window.GAME_DATA`.
- Добавить объект `mentorHints` в предзагруженный `window.GAME_DATA` в строке 2 `data_loader.js` (Правило 6.1).

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/test_mentor_system.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add game_modular/data/mentor_hints.json game_modular/js/data_loader.js tests/test_mentor_system.js
git commit -m "feat(mentor): add mentor_hints.json and sync data_loader fallback"
```

---

### Task 2: Управление мета-прогрессом в `state.js`

**Files:**
- Modify: `game_modular/js/state.js`
- Test: `tests/test_mentor_system.js`

**Interfaces:**
- Consumes: `localStorage['zooshans_unlocked_mentor_hints']`.
- Produces: 
  - `getUnlockedMentorHints(): string[]`
  - `unlockMentorHint(hintId: string): boolean`
  - `isMentorHintUnlocked(hintId: string): boolean`
  - `resetMentorProgress(): void`
  - `animal.daysSinceVaccine1`: число дней с момента первой прививки.
  - `animal.vaccineDewormLapse`: флаг нарушения протокола вакцинации.

- [ ] **Step 1: Write test for mentor meta-progress storage**

```javascript
// Append to tests/test_mentor_system.js
// Mock localStorage and verify state.js functions
context.startNewRun(false);
assert.deepStrictEqual(context.getUnlockedMentorHints(), [], 'Initial hints should be empty');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false);

const isNew = context.unlockMentorHint('LOW_ENERGY_WARNING');
assert.strictEqual(isNew, true, 'First unlock should return true');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true);
assert.strictEqual(context.unlockMentorHint('LOW_ENERGY_WARNING'), false, 'Duplicate unlock returns false');

// Restart run and verify hints are preserved
context.startNewRun(false);
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true, 'Hints must persist across runs');

// Reset progress
context.resetMentorProgress();
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false, 'Hints should be cleared after reset');
console.log('✓ Task 2: Meta-progress and localStorage persistence verified');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_mentor_system.js`  
Expected: FAIL (`getUnlockedMentorHints is not a function`).

- [ ] **Step 3: Implement meta-progress storage in `game_modular/js/state.js`**

- Добавить методы:
  ```javascript
  const MENTOR_STORAGE_KEY = 'zooshans_unlocked_mentor_hints';
  function getUnlockedMentorHints() { ... }
  function unlockMentorHint(id) { ... }
  function isMentorHintUnlocked(id) { ... }
  function resetMentorProgress() { ... }
  ```
- В `animal` объекта `state` добавить поля:
  - `daysSinceVaccine1: 0`
  - `vaccineDewormLapse: false`

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_mentor_system.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game_modular/js/state.js tests/test_mentor_system.js
git commit -m "feat(mentor): implement meta-progress storage and reset in state.js"
```

---

### Task 3: Реализация логики проверки триггеров наставника

**Files:**
- Modify: `game_modular/js/engine.js`
- Modify: `game_modular/js/actions.js`
- Modify: `game_modular/js/adopters.js`
- Modify: `game_modular/js/events.js`
- Test: `tests/test_mentor_system.js`

**Interfaces:**
- Consumes: текущее `state` (энергия, долг, карантин, дни пиара, статус ИС).
- Produces: `checkMentorTriggers(contextHintId = null)` — проверяет условия и при срабатывании вызывает `triggerMentorHint(hintId)`.

- [ ] **Step 1: Write tests for all 8 triggers**

```javascript
// Test 3: Triggers verification
// 1. LOW_ENERGY_WARNING
context.startNewRun(false);
context.resetMentorProgress();
context.state.energy = 25;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), 'LOW_ENERGY_WARNING should trigger at energy <= 25');

// 2. CLINIC_DEBT_HALFWAY
context.state.zooshans.voucherDebt = 500;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('CLINIC_DEBT_HALFWAY'), 'CLINIC_DEBT_HALFWAY should trigger at debt >= 500');

// 3. QUARANTINE_BREACH_RISK
context.state.player.ownPets = { id: 'unvaccinated_cat' };
context.state.zooshans.locationStatus = 'home_floor';
context.state.animal.species = 'cat';
context.state.animal.quarantineDaysDone = 0;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('QUARANTINE_BREACH_RISK'), 'QUARANTINE_BREACH_RISK should trigger with unvax cat on floor');

// 4. REVACCINATION_OVERDUE
context.state.animal.parasitesAndVaccinated = true;
context.state.animal.daysSinceVaccine1 = 29;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('REVACCINATION_OVERDUE'), 'REVACCINATION_OVERDUE triggers past 28 days');

// 5. STALE_PR_WARNING
context.state.pr.prActive = true;
context.state.pr.daysSinceAdRefresh = 15;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('STALE_PR_WARNING'), 'STALE_PR_WARNING triggers when PR refresh > 14 days');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_mentor_system.js`  
Expected: FAIL (`checkMentorTriggers is not defined`).

- [ ] **Step 3: Implement `checkMentorTriggers` in `game_modular/js/engine.js`**

- Реализовать функцию `checkMentorTriggers(directHintId = null)`:
  - Если передан `directHintId` и он еще не открыт — вызвать `triggerMentorHint(directHintId)`.
  - Проверить параметрические условия (`LOW_ENERGY_WARNING`, `CLINIC_DEBT_HALFWAY`, `QUARANTINE_BREACH_RISK`, `REVACCINATION_OVERDUE`, `STALE_PR_WARNING`).
  - При обнаружении подходящего триггера вызвать `triggerMentorHint(id)`.
- Инкрементировать `animal.daysSinceVaccine1 += 1` в `processDayTick()` при наличии прививки.
- Вызывать `checkMentorTriggers()` в конце `processDayTick()` перед `renderAll()`.

- [ ] **Step 4: Integrate triggers into `actions.js` and `adopters.js`**

- В `adopters.js`:
  - `FIRST_TRIAL_STARTED`: вызывать в `finishTransferToTrial()`.
  - `ADOPTION_FAILED_POSTMORTEM`: вызывать при возврате с ИС (красный флаг или астма).
  - `SCAM_VICTIM_POSTMORTEM`: вызывать при списании денег или потере подопечного от мошенников.
- В `actions.js`:
  - При вакцинации фиксировать `animal.daysSinceVaccine1 = 0` и проверять `vaccineDewormLapse` (если `dewormStage < 2`).
  - Вызывать `checkMentorTriggers()` после списания энергии и увеличения долга по талону.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node tests/test_mentor_system.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add game_modular/js/engine.js game_modular/js/actions.js game_modular/js/adopters.js tests/test_mentor_system.js
git commit -m "feat(mentor): implement 8 reactive triggers in engine, actions, and adopters"
```

---

### Task 4: Модальное окно подсказки `#mentorModal` и очередь показа в `ui.js`

**Files:**
- Modify: `game_modular/index.html:800-850`
- Modify: `game_modular/js/ui.js`
- Test: `tests/test_mentor_system.js`

**Interfaces:**
- Consumes: `window.GAME_DATA.mentorHints`.
- Produces:
  - `triggerMentorHint(hintId, onDismissCallback)`
  - `closeMentorModal()`
  - Очередь `mentorHintQueue` для последовательного показа.

- [ ] **Step 1: Write test for modal trigger and queue**

```javascript
// Append to tests/test_mentor_system.js
// Verify triggerMentorHint stops timer and unlocks hint
context.resetMentorProgress();
context.setSpeed(2);
assert(context.currentSpeed > 0, 'Speed should be active');

context.triggerMentorHint('LOW_ENERGY_WARNING');
assert.strictEqual(context.currentSpeed, 0, 'Timer must be stopped when mentor modal opens');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true, 'Hint marked unlocked');

context.closeMentorModal();
console.log('✓ Task 4: Mentor modal queue and Timer Guard verified');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_mentor_system.js`  
Expected: FAIL (`triggerMentorHint is not defined`).

- [ ] **Step 3: Add `#mentorModal` to `game_modular/index.html`**

Разместить независимое модальное окно с `z-index: 55`:
- Подложка с размытием (`modal-backdrop-custom`).
- Карточка с цветной рамкой и бейджем (спокойный для `advice`, предупреждающий для `post_mortem`).
- Заголовок (`#mentorModalTitle`), категория (`#mentorModalCategory`), аватар спикера, текст сообщения (`#mentorModalMessage`).
- Плашка «💡 Золотое правило куратора» (`#mentorModalRule`).
- Кнопка «Принять к сведению» (`#btnMentorDismiss`), вызывающая `closeMentorModal()`.

- [ ] **Step 4: Implement queue and styling logic in `game_modular/js/ui.js`**

- Реализовать `triggerMentorHint(hintId, onDismissCallback)`:
  - Проверить `isMentorHintUnlocked(hintId)`: если уже открыто — не показывать повторно (если не вызвано принудительно).
  - Записать в `localStorage` через `unlockMentorHint(hintId)`.
  - Остановить таймер: `stopTimer()`.
  - Если уже открыто другое модальное окно наставника, поместить в массив `mentorHintQueue`.
  - Отрендерить стили (для `advice` — изумруд/небо, для `post_mortem` — коралл/роза).
  - Показать `#mentorModal`.
- Реализовать `closeMentorModal()`:
  - Скрыть `#mentorModal`.
  - Если в `mentorHintQueue` есть элементы, запустить следующий.
  - Если передан `onDismissCallback`, вызвать его.
  - Обновить счетчик в шапке игры (`updateHeaderMentorCounter()`).

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/test_mentor_system.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add game_modular/index.html game_modular/js/ui.js tests/test_mentor_system.js
git commit -m "feat(mentor): add #mentorModal and prioritize queue with Timer Guard"
```

---

### Task 5: Кнопка в шапке и архив «Памятка куратора» `#mentorArchiveModal`

**Files:**
- Modify: `game_modular/index.html:60-80, 850-920`
- Modify: `game_modular/js/ui.js`
- Test: `tests/test_mentor_system.js`

**Interfaces:**
- Consumes: `getUnlockedMentorHints()`, `window.GAME_DATA.mentorHints`.
- Produces:
  - `openMentorArchiveModal()`
  - `closeMentorArchiveModal()`
  - `renderMentorArchive()`
  - `updateHeaderMentorCounter()`

- [ ] **Step 1: Write test for archive modal and progress reset**

```javascript
// Append to tests/test_mentor_system.js
context.unlockMentorHint('LOW_ENERGY_WARNING');
context.unlockMentorHint('FIRST_TRIAL_STARTED');

const unlockedList = context.getUnlockedMentorHints();
assert.strictEqual(unlockedList.length, 2, 'Should have 2 unlocked hints');

context.renderMentorArchive();
const countElem = context.document.getElementById('headerMentorCount');
assert.strictEqual(countElem.textContent, '2/8', 'Header counter should show 2/8');

// Test reset
context.resetMentorProgress();
assert.strictEqual(context.getUnlockedMentorHints().length, 0, 'Should have 0 hints after reset');
context.renderMentorArchive();
assert.strictEqual(countElem.textContent, '0/8', 'Header counter should reset to 0/8');
console.log('✓ Task 5: Mentor archive and counter update verified');
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_mentor_system.js`  
Expected: FAIL (`renderMentorArchive is not defined`).

- [ ] **Step 3: Add button to header in `game_modular/index.html`**

В блоке правых кнопок топ-бара (рядом с кнопками «📖 Альбом» и «📋 Сценарии») добавить:
```html
<button id="btnHeaderMentorMemo" onclick="openMentorArchiveModal()" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition flex items-center gap-1 shadow-sm" title="Памятка куратора: изученные советы и разборы ошибок">
  <span>💡</span> Памятка: <span id="headerMentorCount">0/8</span>
</button>
```

- [ ] **Step 4: Add `#mentorArchiveModal` in `game_modular/index.html`**

- Добавить модальное окно `#mentorArchiveModal`:
  - Заголовок: «💡 Памятка куратора (Советы координатора и разбор ошибок)».
  - Контейнер списка карточек `#mentorArchiveList`.
  - Кнопка в футере: «🗑️ Сбросить прогресс обучения» (красный бордер, вызывает `confirmResetMentorProgress()`).
  - Кнопка «Закрыть».

- [ ] **Step 5: Implement archive rendering and reset in `game_modular/js/ui.js`**

- Реализовать `openMentorArchiveModal()` с вызовом `stopTimer()`.
- Реализовать `renderMentorArchive()`:
  - Обходить все 8 карточек из `window.GAME_DATA.mentorHints`.
  - Открытые карточки отображать с полным текстом, категорией, бейджем типа и золотым правилом.
  - Закрытые карточки отображать полупрозрачными с замком `🔒 Еще не открыто в игре`.
  - Обновлять `#headerMentorCount` в формате `${unlocked.length}/${total.length}` (например, `3/8`).
- Реализовать `confirmResetMentorProgress()`:
  - Выводить нативный `confirm('Вы уверены, что хотите сбросить прогресс обучения? Все открытые советы снова станут закрытыми.')`.
  - При согласии вызывать `resetMentorProgress()`, перерендеривать архив и выводить лог.

- [ ] **Step 6: Run test to verify it passes**

Run: `node tests/test_mentor_system.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add game_modular/index.html game_modular/js/ui.js tests/test_mentor_system.js
git commit -m "feat(mentor): add header memo button, archive modal, and learning progress reset"
```

---

### Task 6: Финальная сквозная верификация и регрессионный чеклист

**Files:**
- Verify: all `game_modular/js/*.js` and `game_modular/data/*.json`
- Test: `tests/test_mentor_system.js`, `tests/test_volunteer_mechanics.js`

- [ ] **Step 1: Run comprehensive unit and integration test suite**

Run: `node tests/test_mentor_system.js`  
Run: `node tests/test_volunteer_mechanics.js`  
Expected: All tests PASS.

- [ ] **Step 2: Automated syntax and JSON validation (AGENTS.md Rule 6.2)**

Run:
```powershell
Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
```
Expected: Zero errors.

- [ ] **Step 3: Currency invariant verification (AGENTS.md Rule 6.3)**

Verify no dollar signs or USD strings were introduced in text or data.

- [ ] **Step 4: Commit and finalize**

```bash
git commit -m "chore(mentor): complete end-to-end verification of reactive mentor system"
```
