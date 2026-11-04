# Desktop Layout Restoration, Dog Adopter Synchronization & Food Warning Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить видимость десктопной шапки и шкал HUD на экранах >= 1024px, устранить сюжетный рассинхрон сеток «Антикошка» и «мурчания на руках» при звонках и успешном пристройстве собак, и добавить упреждающее модальное уведомление о заканчивающемся корме/смеси с возможностью быстрой покупки в 1 клик.

**Architecture:** 
1. Стилистическое разделение мобильных и десктопных шапок через `.desktop-header` и `.desktop-hud` в `styles.css` (устранение конфликта с `.hidden !important`).
2. Динамическая адаптация диалогов, жилья и карточки безопасности в `adopters.js` и `calls.json` под вид питомца (собака vs кошка), а также адаптация текста завершения испытательного срока в `events.js`.
3. Интеграция триггера `triggerSuppliesLowModal` в `events.js` / `engine.js` при остатке корма `<= 1 день` с вызовом `showEventModal` и быстрой закупкой.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Node.js (test runners & assertions).

**Spec:** [`docs/superpowers/specs/2026-11-04-desktop-layout-food-alert-dog-sync-design.md`](file:///d:/projects/volontiers/docs/superpowers/specs/2026-11-04-desktop-layout-food-alert-dog-sync-design.md)

## Global Constraints
- Currency strictly BYN (no `$` or `USD`).
- Zero-build compatibility (vanilla ES6, no npm build/vite/webpack dependencies).
- JSON changes must be 100% mirrored in `window.GAME_DATA` in `js/data_loader.js`.
- Modals must call `stopTimer()`, switch mobile view to `actions`, and pause the simulation.

## Review Focus
- Desktop width (>= 1024px): desktop header and HUD cards MUST be visible; mobile sticky top and dock MUST be hidden.
- Mobile width (< 1024px): desktop header and HUD cards MUST be hidden; mobile sticky top and dock MUST be visible.
- Calling `call_ideal_pet_screen_family` with dog: must mention leash, anti-escape harness, address tag, and no Pet Screen or kitten text.
- Trial success with dog: must NOT mention "мурчит", must mention walking on leash in park and wagging tail.
- Food depletion: modal triggers at `daysLeft <= 1` or `0`, pauses time, allows instant buy for 65 BYN (cat) or 120 BYN (dog) if budget permits.
- No repeated modal spam on consecutive ticks if already handled or dismissed on the same day.

---

### Task 1: Fix Desktop Header & HUD Visibility (CSS & HTML)

**Files:**
- Modify: `game_modular/index.html` (lines ~89 and ~341)
- Modify: `game_modular/css/styles.css` (lines ~414-435 and ~1440-1455)
- Test: `tests/test_desktop_header_visibility.js`

**Interfaces:**
- `.desktop-header`: `display: flex !important` at `>= 1024px`, `display: none !important` at `< 1024px`.
- `.desktop-hud`: `display: grid !important` at `>= 1024px`, `display: none !important` at `< 1024px`.

- [ ] **Step 1: Write the failing test**

Create `tests/test_desktop_header_visibility.js` to assert that:
1. `index.html` desktop header has class `desktop-header` and does NOT have class `hidden`.
2. `index.html` desktop HUD section has class `desktop-hud` and does NOT have class `hidden`.
3. `styles.css` specifies `@media (min-width: 1024px)` rules for `.desktop-header { display: flex !important; }` and `.desktop-hud { display: grid !important; }`.
4. `styles.css` specifies `@media (max-width: 1023px)` rules hiding `.desktop-header, .desktop-hud { display: none !important; }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_desktop_header_visibility.js`
Expected: FAIL with assertion error.

- [ ] **Step 3: Implement CSS & HTML updates**

1. In `game_modular/index.html`:
   - Replace `<header class="... mobile-header hidden lg:flex">` with `<header class="sticky top-0 z-30 shrink-0 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-subtle)] px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm desktop-header">`.
   - Replace `<section class="hidden lg:grid grid-cols-2 lg:grid-cols-4 gap-2">` with `<section class="desktop-hud grid-cols-2 lg:grid-cols-4 gap-2">`.
2. In `game_modular/css/styles.css`:
   - Under `@media (max-width: 1023px)`: add `.desktop-header, .desktop-hud { display: none !important; }`.
   - Under `@media (min-width: 1024px)`: add `.desktop-header { display: flex !important; }` and `.desktop-hud { display: grid !important; }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_desktop_header_visibility.js`
Expected: PASS.
Run: `node tests/test_mobile_layout.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game_modular/index.html game_modular/css/styles.css tests/test_desktop_header_visibility.js
git commit -m "fix(ui): restore desktop header and hud visibility with dedicated responsive classes"
```

---

### Task 2: Synchronize Adopter Call Dialogues & Trial Success Text for Dogs

**Files:**
- Modify: `game_modular/data/calls.json`
- Modify: `game_modular/js/data_loader.js` (inline `GAME_DATA`)
- Modify: `game_modular/js/adopters.js` (`getDynamicAdopterCalls` and `ensureCandidateCallSlots`)
- Modify: `game_modular/js/events.js` (`triggerTrialSuccessModal`)
- Test: `tests/test_dog_adopter_sync.js`

**Interfaces:**
- Consumes: `state.animal`, `getAnimalGrammar(a).isDog`, `trialItem.species`
- Produces: 
  - Dog-specific dialogue in `call_ideal_pet_screen_family` (3-strap harness, leash, address tag, park) and title/text in `slot1` ("Безопасность и выгул").
  - Dog-specific trial success text in `triggerTrialSuccessModal` (walking on leash in park, wagging tail, no purring).

- [ ] **Step 1: Write the failing test**

Create `tests/test_dog_adopter_sync.js` to assert that:
1. When generating adopter call for a dog (`species: 'dog'`), `call_ideal_pet_screen_family` does NOT contain "Антикошка" or "Pet Screen" or "котят", and DOES contain "поводке", "шлейке", "адресник".
2. When calling `ensureCandidateCallSlots` for a dog with `call_ideal_pet_screen_family`, `slot1.title` is "Безопасность и выгул" and text refers to leash/harness/address tag.
3. When generating adopter call for a cat (`species: 'cat'`), `call_ideal_pet_screen_family` still mentions "Антикошка" (Pet Screen).
4. When `triggerTrialSuccessModal` runs for a dog (`species: 'dog'`), the text does NOT contain "мурчит", and mentions "гуляет" and "виляет хвостом".
5. For a cat, `triggerTrialSuccessModal` still contains "мурчит на руках".
6. `calls.json` and `GAME_DATA.calls` in `data_loader.js` are in 100% sync.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_dog_adopter_sync.js`
Expected: FAIL.

- [ ] **Step 3: Implement Dog Adopter & Trial Success Synchronization**

1. In `game_modular/js/adopters.js`:
   - In `getDynamicAdopterCalls(a)`:
     If `isDog` is true:
     For `call_ideal_pet_screen_family`:
     - Update dialogue: `«Добрый день! Мы давно следим за деятельностью «Зоошанса». У нас своя квартира рядом с парком, выгул строго на поводке и правильной анатомической шлейке-антипобег, есть адресник с гравировкой. Кормим суперпремиумом, договор куратора подпишем и чипируем!»`.
     - Update extraQuestionReply: `«Мы сдали аллергопанель заранее, отложили подушку безопасности на клинику и занятия с кинологом. Готовы уделять много времени активным прогулкам и дрессировке!»`.
     - Update caller: `Осознанная молодая семья программистов`.
     - `canTakePair`: `Boolean(a.activeCount >= 2)`.
   - In `ensureCandidateCallSlots(call, a)`:
     If `isDog`:
     - `call.housing`: `'Своя кв. рядом с парком (Новая Боровая)'`.
     - `call.slot1`: `{ title: 'Безопасность и выгул', text: 'Выгул строго на поводке и шлейке-антипобег с 3 ремнями, есть адресник. Огороженная площадка рядом с домом, самовыгул исключен.', flag: 'green' }`.
2. In `game_modular/js/events.js`:
   - In `triggerTrialSuccessModal(trialItem)`:
     Check `const isDog = trialItem.species === 'dog';`
     If `isDog`:
     ```javascript
     const petHappyText = isPair
       ? `«${trialItem.petName}» полностью освоились, с удовольствием бегают на прогулках в парке, виляют хвостиками и радуют всю семью!`
       : `«${trialItem.petName}» полностью освоился, с удовольствием гуляет на поводке в парке, виляет хвостом при встрече и радует всю семью!`;
     ```
     If cat:
     ```javascript
     const petHappyText = isPair
       ? `«${trialItem.petName}» полностью освоились, спят в обнимку на мягких подушках, мурчат на руках и радуют всю семью!`
       : `«${trialItem.petName}» полностью освоился, спит на мягких подушках, мурчит на руках и радует всю семью!`;
     ```
3. Sync `calls.json` and `data_loader.js` (inline `GAME_DATA.calls`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_dog_adopter_sync.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game_modular/data/calls.json game_modular/js/data_loader.js game_modular/js/adopters.js game_modular/js/events.js tests/test_dog_adopter_sync.js
git commit -m "fix(adopters): adapt ideal family call dialogue and trial success text for dogs vs cats"
```

---

### Task 3: Implement Food & Supplies Low Warning Modal (Вариант 2)

**Files:**
- Modify: `game_modular/js/events.js` (add `triggerSuppliesLowModal(isZero)` and `triggerFormulaLowModal(isZero)`)
- Modify: `game_modular/js/engine.js` (call trigger in `processDayTick`)
- Modify: `game_modular/js/state.js` (add `supplies.lastWarningDay` tracking)
- Test: `tests/test_food_warning_modal.js`

**Interfaces:**
- `triggerSuppliesLowModal(isZero)`: stops timer, switches tab to `actions`, opens modal with 3 choices:
  1. `Купить корм и наполнитель на 14 дней (-65 BYN / -120 BYN)`
  2. `Перейти в зоомагазин (Быт и Пиар)`
  3. `Отложить (куплю позже)`
- `triggerFormulaLowModal(isZero)`: stops timer, switches tab to `actions`, opens modal for Babycat Milk (105 BYN).

- [ ] **Step 1: Write the failing test**

Create `tests/test_food_warning_modal.js` verifying that:
1. When food drops to `<= 1`, `triggerSuppliesLowModal` is invoked and pauses timer.
2. If cash is sufficient, clicking instant purchase deducts 65/120 BYN, increments `daysLeft` by 14, and does not apply starvation penalty.
3. If cash is insufficient, a warning is added to log without deducting into negative cash.
4. Second call on the same game day does not trigger duplicate modal.
5. Formula warning triggers appropriately for foster newborns when `milkDaysLeft <= 1`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_food_warning_modal.js`
Expected: FAIL.

- [ ] **Step 3: Implement Modal Triggers and Engine Integration**

1. In `game_modular/js/events.js`:
   - Implement `triggerSuppliesLowModal(isZero)`:
     - Calculates cost: `g.isDog ? 120 : 65`.
     - Calls `showEventModal(title, body, choices)`.
     - Option 1 (Instant buy): checks cash, buys 14d supply, logs success, closes modal.
     - Option 2 (Go to shop): switches to `tabBtn_care` / `switchTab('care')`, closes modal.
     - Option 3 (Later): closes modal.
   - Implement `triggerFormulaLowModal(isZero)`:
     - Cost: 105 BYN.
     - Option 1: instant buy Babycat milk (+14d), option 2: shop, option 3: later.
2. In `game_modular/js/engine.js`:
   - In `processDayTick()`:
     - Check `totalFood <= 1` before deducting daily supply or when `daysLeft === 0`.
     - If triggered, set `state.supplies.lastWarningDay = state.day`, invoke `triggerSuppliesLowModal(totalFood <= 0)` and return (or continue after modal interaction).
     - Check `state.newborn.active && !isAnimalAtPlayerHome() && state.newborn.milkDaysLeft <= 1`.
3. In `game_modular/js/state.js`:
   - Ensure `state.supplies.lastWarningDay = -1`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_food_warning_modal.js`
Expected: PASS.

- [ ] **Step 5: Pre-Commit Syntax & Integrity Checks**

Run PowerShell pre-commit checks:
```powershell
Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
node tests/test_desktop_header_visibility.js
node tests/test_dog_adopter_sync.js
node tests/test_food_warning_modal.js
```
Expected: All checks pass with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add game_modular/js/events.js game_modular/js/engine.js game_modular/js/state.js tests/test_food_warning_modal.js
git commit -m "feat(supplies): add proactive food and formula depletion warning modal with 1-click buy"
```
