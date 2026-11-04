# Desktop Album, Foster Maneuver, Purebred Auto-Search & Fundraiser Toggles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the desktop Album/service buttons visibility, unblock social foster searches during 3-day adopter grace periods (maneuver), automate 10-day old-owner search countdowns for lost/purebred pets to unblock PR, provide toggles to open and close card/official fundraisers, and eliminate test flakes.

**Architecture & Constraints:**
- Zero-build vanilla ES6+ (runnable directly in browser / `file://`).
- Currency is strictly **BYN** (never `$`, `USD`, or `руб`).
- Synchronize all `data/*.json` updates with `window.GAME_DATA` in `data_loader.js`.
- Respect Timer Guard on all dialogs (`stopTimer()`).
- Automated syntax validation on all JS and JSON files after edits.

---

## File Structure & Responsibilities

| File | Purpose / Changes |
| --- | --- |
| `game_modular/index.html` | Replace `.hidden lg:flex` wrapper for desktop service buttons with `.desktop-service-buttons`. |
| `game_modular/css/styles.css` | Define `.desktop-service-buttons` visibility rules (`display: none !important` on `<1024px`, `display: flex !important` on `>=1024px`). |
| `game_modular/js/ui.js` | 1) Allow social foster search button when `state.maneuver.active` is true. 2) Display automated 10-day search countdown for lost/purebred pets in PR button and Radar. 3) Render "Закрыть сбор на карту" and "Закрыть сбор на р/с" buttons when fundraisers are active. |
| `game_modular/js/engine.js` | Advance 10-day lost pet search automatically each day tick without requiring manual button clicks. |
| `game_modular/js/actions.js` | Implement `actionTogglePersonalFundraiser()` and `actionToggleOfficialFundraiser()`. Ensure maneuver state clears when foster is secured. |
| `tests/test_desktop_header_visibility.js` | Assert `.desktop-service-buttons` exists and Album button is visible on desktop. |
| `tests/test_foster_maneuver_search.js` | Test that foster search is unlocked during 3-day maneuver and clears maneuver on success. |
| `tests/test_purebred_search_auto_progression.js` | Test 10-day auto-progression, scam call triggers at days 3/6, and PR unlock at day 10. |
| `tests/test_fundraiser_toggles.js` | Test toggling card and official fundraisers open/close and verifying daily donation/audit pause. |
| `tests/test_food_warning_modal.js` | Fix fixture sanitization to eliminate mother cat lactating test flake. |

---

## Tasks

### Task 0: Fix Test Fixture Flake in `tests/test_food_warning_modal.js`
**Objective:** Add `state.animal.hasMotherCat = false; state.animal.motherLactating = false;` to `sanitizeFixture()` in `tests/test_food_warning_modal.js` to prevent the 6% flake when rolling `dacha_mother_with_kittens`.

- [ ] Update `tests/test_food_warning_modal.js:sanitizeFixture()` to clear `hasMotherCat` and `motherLactating`.
- [ ] Run `node tests/test_food_warning_modal.js` 10 times in a row to verify zero flakes.
- [ ] Commit fix as `fix(tests): sanitize mother cat lactating flags in food warning test fixture`.

---

### Task 1: Desktop Album & Service Buttons Visibility Restoration
**Objective:** Replace `.hidden lg:flex` with dedicated class `.desktop-service-buttons` so `.hidden { display: none !important; }` does not suppress the Album button, Scenario selector, Mentor memo, and New Game button on desktop.

- [ ] Write failing test in `tests/test_desktop_header_visibility.js` asserting `.desktop-service-buttons` class exists on the container wrapping `showAlbumModal()` and that `.hidden` is NOT on this container.
- [ ] In `game_modular/index.html:139`, replace `<div class="hidden lg:flex items-center gap-1.5 flex-wrap">` with `<div class="desktop-service-buttons items-center gap-1.5 flex-wrap">`.
- [ ] In `game_modular/css/styles.css`:
  - Under `@media (max-width: 1023px)`, add `.desktop-service-buttons` to `display: none !important;`.
  - Under `@media (min-width: 1024px)`, add `.desktop-service-buttons { display: flex !important; }`.
- [ ] Run `node tests/test_desktop_header_visibility.js` to verify it passes.
- [ ] Run automated PowerShell syntax validation across all JS and JSON files.
- [ ] Commit as `fix(ui): restore desktop album and service buttons visibility via dedicated class`.

---

### Task 2: 3-Day Maneuver Foster Search Lock Fix
**Objective:** When adopters request a return and agree to a 3-day grace period (`state.maneuver.active === true`, `locationStatus === 'maneuver_adopters'`), keep "SOS-пост: Поиск передержки" active so players can find a new foster as instructed.

- [ ] Write unit test `tests/test_foster_maneuver_search.js` asserting that when `state.maneuver = { active: true, daysRemaining: 3 }`:
  - The SOS foster button has `state: 'active'`, `onClick: actionSearchSocialFosterPost`.
  - Finding a foster resets `state.maneuver.active = false`.
- [ ] In `game_modular/js/ui.js` (around line 1684):
  - Check `const isManeuver = Boolean(state.maneuver && state.maneuver.active);`.
  - If `isManeuver`:
    - `badge`: `'Срочно (маневр 3 дн.)'`
    - `sub`: `'Срочный поиск новой передержки: ручки согласились подержать питомца лишь 3 дня!'`
    - `costEnergy`: 15
    - `state`: `'active'`
    - `statusText`: `''`
    - `onClick`: `actionSearchSocialFosterPost`
  - Otherwise if `!atHome`: retain `state: 'completed'`, `statusText: '✓ Подопечный на передержке'`.
- [ ] In `game_modular/js/actions.js`: ensure `actionSearchSocialFosterPost` sets `state.maneuver.active = false` upon successfully placing the pet.
- [ ] Run `node tests/test_foster_maneuver_search.js`.
- [ ] Run syntax check.
- [ ] Commit as `fix(adopters): unblock foster search during 3-day adopter maneuver grace period`.

---

### Task 3: Purebred / Lost Pet 10-day Automatic Search Progression
**Objective:** Per GDD 4.1 and Civil Code art. 231, searching for old owners of lost/purebred pets must automatically progress for 10 days from discovery, triggering scam events on days 3 and 6, and unblocking PR and sterilization on day 10 without requiring an unreachable button click.

- [ ] Write unit test `tests/test_purebred_search_auto_progression.js`:
  - Initialize pet with `hiddenState.isLostOrPurebred = true`.
  - Step through day ticks: verify `lostSearchDaysDone` increments from 0 to 10 automatically.
  - Verify day 3 and day 6 scam call triggers.
  - Verify that at day 10, search finishes and PR/sterilization are unblocked.
- [ ] In `game_modular/js/engine.js`:
  - In `processDayTick()`: change the check from `if (state.pr.lostSearchActive && state.pr.lostSearchDaysDone < 10)` to:
    `if (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10)`.
  - Increment `state.pr.lostSearchDaysDone += 1;` each tick.
  - Trigger scam calls at day 3 and day 6 if not already triggered.
  - When `state.pr.lostSearchDaysDone >= 10`: set `state.pr.lostSearchActive = false`, resolve 30% old owner match or 70% unblock.
- [ ] In `game_modular/js/ui.js`:
  - In `getRadarItems()`: show `🔎 Поиск старых хозяев (осталось ${10 - state.pr.lostSearchDaysDone} дн.)` when `h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10`.
  - In `careButtons`: when `h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10`:
    - Display `title`: `'Поиск старых хозяев (ст. 231 ГК РБ)'`.
    - `badge`: `${state.pr.lostSearchDaysDone}/10 дн.`.
    - `sub`: `'По закону и правилам зоозащиты поиск старых хозяев длится 10 дней со дня находки. Стерилизация и пиар новым ручкам заблокированы.'`.
    - `state`: `'locked'`.
    - `statusText`: `🔒 Поиск хозяев (${state.pr.lostSearchDaysDone}/10 дн.)`.
- [ ] Run `node tests/test_purebred_search_auto_progression.js`.
- [ ] Run syntax check.
- [ ] Commit as `fix(pr): automate 10-day lost pet old-owner search countdown to unblock PR`.

---

### Task 4: Fundraiser Close / Toggle Actions (Card & Official Account)
**Objective:** Allow players to close active personal card fundraisers and official bank account fundraisers, pausing daily donations and pausing the 7-day fin-report requirement.

- [ ] Write unit test `tests/test_fundraiser_toggles.js`:
  - Open personal fundraiser -> active.
  - Day ticks trigger donations and fin report tracking.
  - Close personal fundraiser -> `state.zooshans.personalFundraiserActive = false`.
  - Subsequent day ticks do not increment `daysSinceLastFinReport` and do not generate card donations.
  - Open/close official fundraiser toggles `officialFundraiserActive`.
- [ ] In `game_modular/js/actions.js`:
  - Implement `actionTogglePersonalFundraiser()`:
    - If `state.zooshans.personalFundraiserActive`: set to `false`, add log `"День ${state.day}: 💳 Сбор на личную карту закрыт. Поступление донатов и требование 7-дневного финотчета приостановлены."`, `renderAll()`.
    - If inactive: check ban and 6500 limit, spend 15 energy, set to `true`, reset `daysSinceLastFinReport = 0`, log, `renderAll()`.
  - Implement `actionToggleOfficialFundraiser()`:
    - If `state.zooshans.officialFundraiserActive`: set to `false`, add log `"День ${state.day}: 🏦 Официальный сбор на р/с «Зоошанса» закрыт."`, `renderAll()`.
    - If inactive: check eligibility, spend 15 energy, set to `true`, log, `renderAll()`.
- [ ] In `game_modular/js/ui.js`:
  - In `zooButtons`:
    - For Official Fundraiser: if `state.zooshans.officialFundraiserActive`:
      - `title`: `'Закрыть сбор на р/с'`
      - `badge`: `'Р/С открыт'`
      - `sub`: `'Нажмите, чтобы остановить официальный сбор фонда на расчетный счет.'`
      - `costEnergy`: 0
      - `state`: `'active'`
      - `statusText`: `'✓ Активен'`
      - `onClick`: `actionToggleOfficialFundraiser`
      Otherwise: `title: 'Сбор на р/с «Зоошанса»'`, `costEnergy: 15`, `onClick: actionToggleOfficialFundraiser`.
    - For Personal Fundraiser: if `state.zooshans.personalFundraiserActive`:
      - `title`: `'Закрыть сбор на карту'`
      - `badge`: `'Активен'`
      - `sub`: `'Нажмите, чтобы остановить сбор на личную карту и приостановить требование 7-дневного финотчета.'`
      - `costEnergy`: 0
      - `state`: `'active'`
      - `statusText`: `'✓ Активен'`
      - `onClick`: `actionTogglePersonalFundraiser`
      Otherwise: `title: 'Сбор на личную карту'`, `costEnergy: 15`, `onClick: actionTogglePersonalFundraiser`.
  - In Radar: if `!state.zooshans.personalFundraiserActive`, hide 7-day fin-report deadline reminder.
- [ ] Run `node tests/test_fundraiser_toggles.js`.
- [ ] Run syntax check.
- [ ] Commit as `feat(fundraising): allow curators to toggle and close personal and official fundraisers`.

---

### Task 5: Full Regression Testing & Code Review
**Objective:** Run the entire test suite, verify zero syntax errors and BYN currency invariants, and submit for code review.

- [ ] Run all test files:
  `Get-ChildItem -Path tests/*.js | ForEach-Object { node $_.FullName }`
- [ ] Run PowerShell syntax checks on all JS and JSON files.
- [ ] Dispatch Lead Code Reviewer subagent for broad review across all changes.
- [ ] Verify clean git status with all changes committed.
