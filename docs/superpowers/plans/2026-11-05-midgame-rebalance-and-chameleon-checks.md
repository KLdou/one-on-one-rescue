# Mid-Game Rebalance & Chameleon Deep Candidate Check Implementation Plan (v2.3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase mid-game engagement (Days 5–20) for clinically stable scenarios via dynamic difficulty ("Реальная практика" upon >= 2 rescues), 4 new mid-game crisis dilemmas with trade-offs between Energy (⚡), Mental (🧠), and Budget (💰), 35% chance of "Chameleon candidates" on Kufar requiring deep photo checks (-20⚡), and false-victory delayed returns on Day 3–4 with realistic penalties.

**Architecture:**
- Zero-build vanilla ES6+ (runnable directly in browser / `file://`).
- Currency is strictly **BYN** (never `$`, `USD`, or `руб`).
- Synchronize all `data/*.json` updates with `window.GAME_DATA` in `data_loader.js` (if modified).
- Respect Timer Guard on all dialogs (`stopTimer()`).
- Automated syntax validation on all JS and JSON files after edits.

## Global Constraints
- Strictly vanilla HTML5, CSS3, ES6+ JavaScript. No npm build tools or bundlers.
- Currency formatted with `BYN`.
- Autostop (`stopTimer()`) must reliably trigger on any midgame crisis and candidate return modal to stop 5x fast-forward.
- Backward compatibility: preserve all existing saves in `localStorage` (`zooshans_saved_album`, `experiencedCurator`).

---

## File Structure & Responsibilities

| File | Purpose / Changes |
| --- | --- |
| `game_modular/js/state.js` | 1) Add `realPracticeMode: false`, `householdEnergyLock: 0`, `tempEnergyLocks: []`, `pendingMentalEvents: []`, `dailyMentalDrains: []` to state. 2) Set `realPracticeMode = true` when `getSavedAlbum().length >= 2` or manually toggled. 3) Adapt `calcDailyEnergyReserve` to account for energy locks. |
| `game_modular/js/events.js` | 1) Export `MIDGAME_CRISES` database (4 crises: incubation ringworm, adaptation rebellion, foster ultimatum, zooshans chat SOS). 2) Implement `triggerMidgameCrisisModal(crisis)`. 3) Implement `triggerChameleonReturnModal(trialItem)`. |
| `game_modular/js/adopters.js` | 1) Export `CHAMELEON_CANDIDATES` database (plastic mosquito net, secret allergy gift, genuine ideal adopter). 2) In `triggerRandomAdopterCall()`, 35% chance to roll chameleon if `realPracticeMode`. 3) Implement `actionRequestPhotoCheck()`. 4) In `renderCandidateActionButtons()`, render button `📸 Запросить фото окон и условий (-20⚡)`. 5) In `finishTransferToTrial()`, attach return event if uninspected hidden red flag. |
| `game_modular/js/engine.js` | 1) Check midgame crises triggers between days 5–20. 2) Tick `tempEnergyLocks`, `pendingMentalEvents`, and `dailyMentalDrains`. 3) Advance trial days and trigger `triggerChameleonReturnModal` on day 3–4 for uninspected chameleons. 4) Ensure `stopTimer()` fires. |
| `game_modular/js/ui.js` | 1) Render «Реальная практика» badge in header. 2) Display photo check status in `candidateInterviewModal`. 3) Reflect energy lock in HUD. |
| `game_modular/index.html` | 1) Add container `#candidatePhotoCheckResultBox` in `candidateInterviewModal`. 2) Add manual toggle for «Реальная практика» in new run / header. |
| `tests/test_real_practice_progression.js` | Test album length >= 2 activates `realPracticeMode`. |
| `tests/test_midgame_crises.js` | Test all 4 midgame crises trigger within day ranges and apply correct trade-off choices. |
| `tests/test_chameleon_candidates.js` | Test 35% chameleon spawn, photo check (-20⚡), and unmasking. |
| `tests/test_chameleon_return.js` | Test false final: trial transfer, 3–4 day delayed return with health, mental, and PR penalties. |

---

## Tasks

### Task 1: Dynamic Difficulty State & Meta-Progression Mode ("Реальная практика")
**Objective:** Add `realPracticeMode` activation when `getSavedAlbum().length >= 2` or via manual toggle, plus state tracking for energy locks, pending mental rewards, and daily mental drains.

- [ ] **Step 1: Write the failing test**
Create `tests/test_real_practice_progression.js` testing:
  - When `getSavedAlbum().length` is 0 or 1, `state.realPracticeMode` defaults to `false`.
  - When `getSavedAlbum().length >= 2`, `state.realPracticeMode` initializes to `true`.
  - Manual toggle overrides `state.realPracticeMode`.
  - Energy reserve calculation deducts `householdEnergyLock` and `tempEnergyLocks`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_real_practice_progression.js`
Expected: FAIL.

- [ ] **Step 3: Implement state properties and calculation in `state.js` and `ui.js`**
  - In `state.js:resetState()`:
    - Check `const albumCount = getSavedAlbum().length;`
    - `const isRealPractice = albumCount >= 2 || (document.getElementById('chkRealPractice') && document.getElementById('chkRealPractice').checked);`
    - Add to `state`:
      ```javascript
      realPracticeMode: Boolean(isRealPractice),
      householdEnergyLock: 0,
      tempEnergyLocks: [],
      pendingMentalEvents: [],
      dailyMentalDrains: []
      ```
  - In `state.js:calcDailyEnergyReserve()`:
    - Subtract `state.householdEnergyLock` and sum of active `state.tempEnergyLocks`.
  - In `index.html` and `ui.js`: Add toggle/badge for «Реальная практика» in header.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_real_practice_progression.js`
Expected: PASS.

- [ ] **Step 5: Syntax check & commit**
Commit: `feat(difficulty): add dynamic Real Practice mode based on rescue album meta-progression`

---

### Task 2: Mid-Game Crises (Days 5–20) Anti-FastForward Engine
**Objective:** Integrate the 4 mid-game crisis dilemmas in `events.js` and trigger them in `engine.js` with autostop.

- [ ] **Step 1: Write the failing test**
Create `tests/test_midgame_crises.js` testing:
  - Crisis 1 (`crisis_incubation_ringworm`): triggers on days 6–10 for stable cats, choice A resets PR and delays vaccination, choice B penalizes health and adds mental penalty.
  - Crisis 2 (`crisis_adaptation_rebellion`): triggers on days 8–14, choice A costs BYN/⚡ and boosts mental, choice B inflicts daily mental drain (-8🧠/d for 4 days).
  - Crisis 3 (`crisis_foster_ultimatum`): triggers on days 10–18, choice A pays BYN/⚡, choice B locks 15⚡ household energy.
  - Crisis 4 (`crisis_zooshans_chat_sos`): triggers on days 12–16, choice A locks 15⚡ for 4 days and grants +25🧠 after 4 days, choice B inflicts -18🧠 guilt.
  - Each crisis pauses timer via `stopTimer()`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_midgame_crises.js`
Expected: FAIL.

- [ ] **Step 3: Implement crises in `events.js` and progression in `engine.js`**
  - In `events.js`: Add `MIDGAME_CRISES` array and `triggerMidgameCrisisModal(crisis)`.
  - In `engine.js:processDayTick()`:
    - Tick active `dailyMentalDrains` (deduct mental, decrement days).
    - Tick `tempEnergyLocks` (decrement days, release when 0).
    - Tick `pendingMentalEvents` (trigger delayed mental reward when day reached).
    - If `state.realPracticeMode` and `state.day >= 5 && state.day <= 20`:
      - Check conditions for un-triggered midgame crises and trigger one per run.
      - Ensure `stopTimer()` is invoked immediately.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_midgame_crises.js`
Expected: PASS.

- [ ] **Step 5: Syntax check & commit**
Commit: `feat(events): add mid-game crisis dilemmas and anti-fastforward pause for days 5-20`

---

### Task 3: Chameleon Candidates & Deep Photo Check (-20⚡)
**Objective:** Add 35% chance to generate chameleon candidates on Kufar with hidden red flags, and implement the `📸 Запросить фото окон и условий (-20⚡)` action.

- [ ] **Step 1: Write the failing test**
Create `tests/test_chameleon_candidates.js` testing:
  - When `state.realPracticeMode` is active, Kufar call generator has 35% chance to produce a chameleon candidate.
  - Chameleon candidate presents socially acceptable answers in all 3 basic slots (`flag: 'green'`), but possesses `hasHiddenRedFlag: true`.
  - `actionRequestPhotoCheck()` spends 20⚡, unmasks `hasHiddenRedFlag: true` (candidate reacts and flees, curator mental -5🧠, blocks adoption).
  - Genuine ideal chameleon (`cham_genuine_ideal_adopter`) yields `hasHiddenRedFlag: false`, grants +10🧠, and confirms 0% return risk.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_chameleon_candidates.js`
Expected: FAIL.

- [ ] **Step 3: Implement candidate generator and photo check in `adopters.js` & `index.html`**
  - In `adopters.js`:
    - Add `CHAMELEON_CANDIDATES` array.
    - In `triggerRandomAdopterCall()`: roll 35% chance for chameleon when `state.realPracticeMode`.
    - In `ensureCandidateCallSlots()`: set up chameleon slots.
    - Implement `actionRequestPhotoCheck()`:
      - Checks `spendEnergy(20)`.
      - If `call.hasHiddenRedFlag`: reveals truth, candidate refuses antimosquito net / confesses allergy, applies mental impact, marks `unmasked = true` and `blocked = true`.
      - If clean: reveals verified photos, mental +10, `call.verifiedSafe = true`, `returnRiskIfAdopted = 0`.
      - Renders photo check result in UI.
  - In `index.html`:
    - Add `<div id="candidatePhotoCheckResultBox" class="hidden mb-3"></div>` in `candidateInterviewModal`.
    - Add photo check button in `renderCandidateActionButtons()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_chameleon_candidates.js`
Expected: PASS.

- [ ] **Step 5: Syntax check & commit**
Commit: `feat(adopters): add chameleon candidates and deep photo check action in call modal`

---

### Task 4: False Final & Delayed Trial Return on Day 3–4
**Objective:** If a pet is handed over to an uninspected chameleon with a hidden red flag, allow 3–4 days of trial period before triggering an emergency return event with realistic penalties.

- [ ] **Step 1: Write the failing test**
Create `tests/test_chameleon_return.js` testing:
  - Handing over pet to uninspected chameleon transfers to trial without instant game over.
  - On day 3 or 4 of trial, triggers `triggerChameleonReturnModal()`.
  - Autostop pauses timer (`stopTimer()`).
  - Penalties applied: pet returned to curator, health drops -15..-25%, mental drops -30..-35🧠, vet bill charged if applicable, Kufar PR progress reset.
  - Learning debrief lesson added to curator log.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_chameleon_return.js`
Expected: FAIL.

- [ ] **Step 3: Implement return mechanics in `adopters.js`, `engine.js`, and `events.js`**
  - In `adopters.js:finishTransferToTrial()`:
    - If `callData.isChameleon && callData.hasHiddenRedFlag && !callData.photoChecked`:
      - Attach `returnEvent: callData.returnEvent`.
      - Set `targetDays: callData.returnEvent.daysUntilReturn || 3`.
      - Set `isChameleonReturn: true`.
  - In `engine.js:processDayTick()`:
    - In `state.trialAnimals` loop, check `item.isChameleonReturn && item.daysPassed >= item.targetDays`.
    - Call `triggerChameleonReturnModal(item)`.
    - Apply health delta, mental delta, vet bill, and reset PR.
    - Return pet to active care (`state.animal.activeCount += item.count`).
  - In `events.js`: Implement `triggerChameleonReturnModal(trialItem)`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_chameleon_return.js`
Expected: PASS.

- [ ] **Step 5: Syntax check & commit**
Commit: `feat(trial): implement false final and delayed chameleon pet return on days 3-4`

---

### Task 5: Full Regression Testing & Verification Before Completion
**Objective:** Run all test suites across the repository, verify syntax, and ensure all invariants are intact.

- [ ] Run full test suite across all `tests/*.js`.
- [ ] Run automated PowerShell syntax validation across all `game_modular/js/*.js` and `game_modular/data/*.json`.
- [ ] Verify strict BYN currency invariant (no `$`, `USD`, `руб`).
- [ ] Verify timer guards (`stopTimer()`).
- [ ] Final commit.
