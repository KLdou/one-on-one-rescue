# Volunteer Interception, Flea Market Deworming & Header Speed Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated Wood's lamp check on experienced volunteer takeover, volunteer deworming request with flea market option, 60-day age cutoff for Babycat formula milk, and fixed right-docked speed controls in the top bar.

**Architecture:**
- State & Actions: Extend volunteer takeover transitions (`temp_volunteer_14d`, `full_volunteer_fincuration`, `social_foster_volunteer`) to auto-perform Wood's lamp examination (`examinedWood = true`), trigger the deworming supply modal with clinic (26 BYN, 0⚡) and volunteer flea market (0 BYN, 10⚡) options, and delegate stage 1 and stage 2 deworming to the volunteer.
- Engine: During daily ticks, if `volunteerHandlesDeworming` is active and 10 days pass since dose 1, the volunteer automatically administers dose 2 without curator energy.
- Food & Formula: Add validation and UI lock in `buyBabycatFormula()` and rendering logic when kitten age is >= 60 days.
- Header Layout: Restructure `index.html` and `styles.css` to dock the time control slot (acute phase button or speed buttons + fast-forward) permanently to the far-right (`ml-auto shrink-0`) so it never moves across responsive breakpoints or day transitions.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS / custom CSS, Node.js for automated testing.

**Spec:** Chat conversation design doc approved on 2026-11-03.

## Global Constraints
- Currency strictly BYN (never `$` or `USD`).
- Zero-build compatibility: runs via `file://` or static servers without bundlers.
- Timer Guard: all modals call `stopTimer()`.
- Pre-commit verification: PowerShell node syntax check & JSON validation.

## Review Focus
1. Volunteer takeover when animal already has ringworm: Wood's lamp must detect and mark `knownRingworm = true` and inform the player.
2. Flea market option when player has < 10 energy: player cannot choose flea market without sufficient energy; must show warning or require clinic / delay.
3. Deworming stage 2 timer: must advance `daysSinceDeworm1` and trigger stage 2 precisely on day 10 when under volunteer care.
4. Kittens turning 60 days old: formula milk button must become disabled, and direct calls to `buyBabycatFormula()` must reject.
5. Responsive screen widths: speed controls must stay pinned at the far-right without wrapping to a new line or moving horizontally.

---

### Task 1: Test Suite for Volunteer Takeover, Flea Market & Formula Cutoff

**Files:**
- Create: `tests/test_volunteer_mechanics.js`

**Interfaces:**
- Consumes: `game_modular/js/state.js`, `game_modular/js/actions.js`, `game_modular/js/engine.js`
- Produces: automated test assertions verifying:
  - Auto Wood's lamp check and ringworm detection on volunteer foster.
  - Volunteer deworming supply: clinic vs flea market.
  - Auto-completion of deworming stage 2 on day 10 by volunteer.
  - Babycat milk purchase block at age >= 60 days.

- [ ] **Step 1: Write the automated test harness**
  Create `tests/test_volunteer_mechanics.js` mocking browser DOM/globals and asserting the new rules.

- [ ] **Step 2: Run test to verify it fails on new features**
  Run: `node tests/test_volunteer_mechanics.js`
  Expected: FAIL (functions or assertions not yet implemented).

---

### Task 2: Babycat Formula Cutoff at 60 Days

**Files:**
- Modify: `game_modular/js/actions.js:480-492`
- Modify: `game_modular/js/ui.js:460-478`, `game_modular/js/ui.js:1604-1620`
- Test: `tests/test_volunteer_mechanics.js`

**Interfaces:**
- Consumes: `state.animal.ageDays`, `state.animal.ageCategory`
- Produces: `buyBabycatFormula()` age check (< 60 days), UI disabled state for `#btnSidebarBuyFormula` and tab 3 button.

- [ ] **Step 1: Update `buyBabycatFormula()` in `actions.js`**
  Check `state.animal.ageDays >= 60 || state.animal.ageCategory === 'adult'`. If true, log informative rejection and return early.

- [ ] **Step 2: Update UI rendering in `ui.js`**
  Disable/hide formula buttons when kitten is >= 60 days old, updating tooltips to indicate transition to solid kitten food.

- [ ] **Step 3: Run tests to verify formula cutoff passes**
  Run: `node tests/test_volunteer_mechanics.js`
  Expected: formula tests pass.

- [ ] **Step 4: Commit**
  ```bash
  git add game_modular/js/actions.js game_modular/js/ui.js tests/test_volunteer_mechanics.js
  git commit -m "feat: block babycat formula purchase for kittens older than 2 months"
  ```

---

### Task 3: Automated Wood's Lamp & Flea Market Deworming on Volunteer Takeover

**Files:**
- Modify: `game_modular/js/state.js`
- Modify: `game_modular/js/actions.js`
- Modify: `game_modular/js/engine.js`
- Modify: `game_modular/js/ui.js`
- Test: `tests/test_volunteer_mechanics.js`

**Interfaces:**
- Consumes: `state.zooshans.locationStatus`, `state.animal.examinedWood`, `state.animal.dewormStage`
- Produces:
  - `promptVolunteerDewormingRequest(volunteerName)` in `actions.js`
  - `a.volunteerHandlesDeworming` flag in `state.js`
  - Auto-handling of stage 1 and stage 2 deworming in `engine.js`

- [ ] **Step 1: Implement volunteer Wood's lamp examination**
  When transitioning to `temp_volunteer_14d`, `full_volunteer_fincuration`, or `social_foster_volunteer`, automatically set `a.examinedWood = true` (and `a.knownRingworm = true` if `hasRingworm`).

- [ ] **Step 2: Implement `promptVolunteerDewormingRequest(volunteerName)`**
  Show modal with options:
  - Clinic purchase: -26 BYN (or 46 BYN), 0⚡.
  - Volunteer flea market / chat: 0 BYN, -10⚡.
  - Later / Delay.
  Sets `a.volunteerHandlesDeworming = true` and applies stage 1 deworming.

- [ ] **Step 3: Update `engine.js` daily tick for volunteer deworming control**
  In `processDayTick()`:
  - If `a.volunteerHandlesDeworming` and `a.dewormStage === 1 && a.daysSinceDeworm1 >= 10`:
    Execute stage 2 deworming automatically without curator energy, adding log: "💊 Волонтер строго по графику дала 2-ю таблетку от паразитов! Курс дегельминтизации успешно завершен."

- [ ] **Step 4: Update `ui.js` status displays**
  Display "Контролирует передержка" in clinic tab and status hints when deworming is handled by volunteer.

- [ ] **Step 5: Run tests to verify all volunteer logic passes**
  Run: `node tests/test_volunteer_mechanics.js`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add game_modular/js/state.js game_modular/js/actions.js game_modular/js/engine.js game_modular/js/ui.js tests/test_volunteer_mechanics.js
  git commit -m "feat: add auto wood check and flea market deworming for experienced volunteer foster"
  ```

---

### Task 4: Fix Speed Switcher to Right Dock in Header

**Files:**
- Modify: `game_modular/index.html:15-107`
- Modify: `game_modular/css/styles.css`
- Modify: `game_modular/js/engine.js:55-100`

**Interfaces:**
- Consumes: Header DOM nodes `#speedButtonsGroup`, `#btnAdvanceAcuteDay`, `#btnFastForward`
- Produces: Dedicated right-docked time-control slot (`#headerTimeControlSlot`) pinned with `ml-auto shrink-0 flex items-center justify-end`.

- [ ] **Step 1: Restructure header DOM in `index.html`**
  - Left container: branding, day counter, pet avatar/name, calendar date, season badge, acute badge.
  - Middle container: secondary action buttons (Drawers, Album, Scenarios, New run).
  - Right container (`#headerTimeControlSlot`):
    Fixed width/shrink-0 container containing `#btnAdvanceAcuteDay` and `#speedButtonsGroup` + `#btnFastForward`.

- [ ] **Step 2: Adjust `engine.js` visibility toggling**
  Ensure `updateSpeedButtonsUI()` toggles `#btnAdvanceAcuteDay` and `#speedButtonsGroup` smoothly within the dedicated right slot without any layout shifts.

- [ ] **Step 3: Verify visual stability across resolutions**
  Test with different pet name lengths and responsive widths.

- [ ] **Step 4: Commit**
  ```bash
  git add game_modular/index.html game_modular/css/styles.css game_modular/js/engine.js
  git commit -m "fix: pin time controls permanently to the right side of the header"
  ```

---

### Task 5: Pre-Commit Verification & Regression Check

**Files:**
- Verification: all JS and JSON files in `game_modular/`

- [ ] **Step 1: Run automated node syntax checks and JSON validation**
  ```powershell
  Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
  Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
  ```

- [ ] **Step 2: Run test suite**
  ```powershell
  node tests/test_volunteer_mechanics.js
  ```

- [ ] **Step 3: Currency & Timer Invariant Verification**
  Verify that all new texts use BYN and any opened modal stops timer.

- [ ] **Step 4: Final commit and summary**
