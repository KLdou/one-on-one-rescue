# UX First-Minute Focus, Floating Tactile Feedback, Wordle Share & Candidate Mistake Highlight Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate early-game cognitive shock with Day 1 action guidance, add floating tactile resource badges on button clicks, implement a compact Wordle-style text summary for social media comments, and prominently highlight fatal uninspected candidate quotes in the defeat debrief.

**Architecture:**
- Zero-build vanilla ES6+ (runnable directly in browser / `file://`).
- Currency is strictly **BYN** (never `$`, `USD`, or `руб`).
- Synchronize all `data/*.json` updates with `window.GAME_DATA` in `data_loader.js`.
- Respect Timer Guard on all dialogs (`stopTimer()`).
- Automated syntax validation on all JS and JSON files after edits.

**Spec / Requirements:**
1. **Когнитивный шок на первой минуте:** On Day 1 (`state.day === 1 && !a.examinedWood`), add a pulsing highlight border and badge `👉 Начни отсюда (Осмотр)` to the primary vet checkup button so the player immediately catches the game rhythm.
2. **Тактильная отдача при трате ресурсов:** Floating micro-badges directly above clicked action buttons (`-50 BYN`, `-12⚡`, `+3🧠`) that float upwards and fade out via CSS keyframe animations.
3. **Текстовый шеринг в стиле Wordle на экране финала:** Add button «💬 Скопировать для комментов» copying a concise 1-2 line social summary (`🐾 «Барсик» в симуляторе спасения (Минск): ... Попробуй вывезти сам: https://zooshans.by`).
4. **Подсветка фатальной ошибки при звонках:** In the defeat debrief (`#endModalMistakesCard`), highlight with a prominent red badge the exact candidate question and phrase that the player skipped / ignored.

## Global Constraints
- Strictly vanilla HTML5, CSS3, ES6+ JavaScript. No npm build tools or bundlers.
- All currency values formatted with `BYN`.
- Safe against null/undefined candidate data.
- Automated PowerShell syntax check after every modification:
  `Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }`
  `Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }`

## Review Focus
1. `state.day === 1 && !a.examinedWood` correctly triggers the pulsing badge, but clears immediately when examined or when day > 1.
2. Clicking action buttons creates floating badges without breaking existing `onClick` logic or causing memory leaks from unremoved DOM elements.
3. Wordle text generation handles both victory and diverse defeat reasons (burnout, piroplasmosis, milk crisis, candidate red flags) with valid grammar and BYN currency.
4. Candidate fatal mistake highlights distinguish between an uninspected slot (`slot2Inspected === false`) vs an inspected red flag ignored by the player.
5. Non-candidate defeats (e.g., piroplasmosis, landlord eviction) gracefully show their standard educational debrief without crashing on missing candidate data.

---

## File Structure & Responsibilities

| File | Purpose / Changes |
| --- | --- |
| `game_modular/css/styles.css` | 1) Keyframe & class `.action-card--first-step` (pulsing emerald glow). 2) Keyframe & classes for `.floating-resource-pill` (`spend-cash`, `gain-cash`, `spend-energy`, `gain-energy`, `spend-mental`, `gain-mental`). 3) Styles for `#candidateFatalHighlightCard`. |
| `game_modular/index.html` | 1) Add button `#btnCopyWordleSummary` in `#endGameModal`. 2) Add container `#candidateFatalHighlightCard` inside `#endModalMistakesCard`. |
| `game_modular/js/ui.js` | 1) Set `isFirstStep` and badge `👉 Начни отсюда (Осмотр)` on primary vet checkup on Day 1. 2) Intercept `btn.onclick` in `renderButtonGrid` to track state deltas and spawn floating badges. 3) Implement `copyWordleSummaryToClipboard()`. 4) Render candidate fatal quote highlight in `showEndGameModal()`. |
| `game_modular/js/adopters.js` | Retain full `callData` including inspection flags when transferring to trial. |
| `game_modular/js/events.js` | Set `state.fatalCandidateData = trialItem.callData` when triggering delayed red flag strike. |
| `tests/test_first_step_onboarding.js` | Unit test for Day 1 primary action badge and pulsing class. |
| `tests/test_floating_resource_feedback.js` | Unit test for delta calculations and floating badge markup. |
| `tests/test_wordle_summary_share.js` | Unit test for Wordle-style text summary generation across scenarios. |
| `tests/test_candidate_fatal_highlight.js` | Unit test for extracting skipped candidate quotes and rendering in debrief. |

---

## Tasks

### Task 1: Day 1 First Step Pulsing Outline & Badge
**Objective:** Add pulsing highlight border and badge `👉 Начни отсюда (Осмотр)` to the primary vet checkup action on Day 1 while unexamined.

- [ ] **Step 1: Write the failing test**
Create `tests/test_first_step_onboarding.js` testing:
  - On Day 1 with `a.examinedWood = false`, primary vet button has badge `👉 Начни отсюда (Осмотр)` and property `isFirstStep: true`.
  - On Day 1 with `a.examinedWood = true`, primary vet button has badge `Сделано` and `isFirstStep` is falsy.
  - On Day 2 with `a.examinedWood = false`, primary vet button does not have the first-step badge.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_first_step_onboarding.js`
Expected: FAIL.

- [ ] **Step 3: Implement CSS in `game_modular/css/styles.css` and logic in `game_modular/js/ui.js`**
  - In `styles.css`: Define `@keyframes pulseFirstStep` and `.action-card--first-step`.
  - In `ui.js` (around line 1100):
    ```javascript
    const isFirstStep = state.day === 1 && !a.examinedWood;
    const checkupBadge = a.examinedWood
      ? 'Сделано'
      : (isFirstStep ? '👉 Начни отсюда (Осмотр)' : 'Клиника');
    ```
    Pass `isFirstStep: isFirstStep` to button object.
  - In `ui.js:renderButtonGrid()`: If `b.isFirstStep && !state.gameOver`, add `btn.classList.add('action-card--first-step')`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_first_step_onboarding.js`
Expected: PASS.

- [ ] **Step 5: Run automated syntax checks & commit**
Run PowerShell syntax checks and commit:
`feat(onboarding): add pulsing highlight and first-step badge on day 1 vet checkup`

---

### Task 2: Floating Micro-Badges for Tactile Resource Spend Feedback
**Objective:** Spawn floating animated micro-badges (`-50 BYN`, `-12⚡`, etc.) directly above the clicked action card when resources change.

- [ ] **Step 1: Write the failing test**
Create `tests/test_floating_resource_feedback.js` testing:
  - Function `computeResourceDeltas(beforeState, afterState)` correctly identifies changes in cash, energy, mental.
  - Helper generates correct labels (`-50 BYN`, `+85 BYN`, `-12 ⚡`, `+3 🧠`) and CSS modifier classes.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_floating_resource_feedback.js`
Expected: FAIL.

- [ ] **Step 3: Implement CSS and floating badge engine**
  - In `styles.css`: Add `@keyframes floatResourceBadge` and `.floating-resource-pill` styles (`spend-cash`, `gain-cash`, `spend-energy`, `gain-energy`, `spend-mental`, `gain-mental`).
  - In `ui.js`:
    - Add `computeResourceDeltas(before, after)` returning array of `{ text, type }`.
    - Add `spawnFloatingResourceBadges(anchorEl, deltas)`:
      - Uses `anchorEl.getBoundingClientRect()` to compute starting coordinates above the card.
      - Creates `.floating-resource-pill` elements, appends to `document.body`, removes after 1000ms.
    - In `renderButtonGrid()`: Wrap `btn.onclick` to capture resource snapshot before `b.onClick(e)`, run action, compute deltas, and trigger `spawnFloatingResourceBadges(btn, deltas)`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_floating_resource_feedback.js`
Expected: PASS.

- [ ] **Step 5: Run automated syntax checks & commit**
Run PowerShell syntax checks and commit:
`feat(ui): add floating tactile resource badges on action card clicks`

---

### Task 3: Wordle-Style Social Text Sharing on Game Over
**Objective:** Add a button and function copying a punchy Wordle-style text summary of the run formatted for social media comments.

- [ ] **Step 1: Write the failing test**
Create `tests/test_wordle_summary_share.js` testing:
  - `generateWordleSummaryText(state)` returns formatted text containing:
    - Pet name and species/city context (`🐾 Я и «Барсик» в симуляторе спасения (Минск): ...`).
    - Days survived (`14 дн.`).
    - BYN spent (`280 BYN`).
    - Filtered bad calls (`3 неадекватов с Куфара`).
    - Defeat or victory tagline (e.g. `выгорел на карантине`, `отдал сомнительным ручкам`, `Дома навсегда! 🏆`).
    - Invitation link (`https://zooshans.by/help-us` or `https://zooshans.by`).
  - Verifies currency is strictly BYN (never $ or USD).

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_wordle_summary_share.js`
Expected: FAIL.

- [ ] **Step 3: Implement button in HTML and generator in JS**
  - In `game_modular/index.html`: Inside `#endGameModal` near `#btnCopyStoryCard`, add button `#btnCopyWordleSummary` with label `💬 Скопировать для комментов`.
  - In `game_modular/js/ui.js`:
    - Implement `generateWordleSummaryText(s = state)`.
    - Implement `copyWordleSummaryToClipboard()` using `navigator.clipboard.writeText(...)` with clipboard fallback and visual button feedback (`✓ Скопировано для комментов!`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_wordle_summary_share.js`
Expected: PASS.

- [ ] **Step 5: Run automated syntax checks & commit**
Run PowerShell syntax checks and commit:
`feat(share): add wordle-style text summary copy button for comments`

---

### Task 4: Highlighting Fatal Candidate Mistake in Educational Debrief
**Objective:** On defeat caused by giving an animal to an unsuitable adopter, highlight in `#endModalMistakesCard` the exact skipped question and candidate quote.

- [ ] **Step 1: Write the failing test**
Create `tests/test_candidate_fatal_highlight.js` testing:
  - When candidate call has `slot2.flag === 'red'` and `slot2Inspected === false`, debrief helper extracts slot 2 title, quote, and marks as skipped.
  - When candidate call has `slot3.flag === 'red'` and `slot3Inspected === false`, debrief helper extracts slot 3 title, quote, and marks as skipped.
  - When candidate call had red flag inspected but accepted, debrief marks as ignored warning.
  - When defeat is unrelated to candidate calls (e.g. `burnout`), returns null/empty highlight without throwing error.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_candidate_fatal_highlight.js`
Expected: FAIL.

- [ ] **Step 3: Implement data retention and debrief UI**
  - In `game_modular/js/events.js:triggerRedFlagDelayedStrikeModal()`:
    - Set `state.fatalCandidateData = trialItem.callData;`
  - In `game_modular/js/state.js`:
    - Ensure `fatalCandidateData: null` in initial state reset.
  - In `game_modular/index.html`:
    - Inside `#endModalMistakesCard`, add `<div id="endModalCandidateMistakeBox" class="hidden mb-3"></div>`.
  - In `game_modular/js/ui.js`:
    - Implement helper `renderCandidateMistakeHighlight(candidateData)`.
    - In `showEndGameModal()`:
      - If `state.fatalCandidateData` exists and has candidate call info:
        - Render prominent rose card with red outline displaying:
          `🚨 РОКОВАЯ ОШИБКА ПРИ ЗВОНКЕ: ${slotTitle}`
          `Бейдж: ❌ Вопрос пропущен (не спросили) / ⚠️ Красный флаг проигнорирован`
          `Цитата кандидата: «${slotText}»`
        - Unhide `#endModalCandidateMistakeBox`.
      - Otherwise hide `#endModalCandidateMistakeBox`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_candidate_fatal_highlight.js`
Expected: PASS.

- [ ] **Step 5: Run automated syntax checks & commit**
Run PowerShell syntax checks and commit:
`feat(debrief): highlight fatal uninspected candidate quotes in defeat debrief`

---

### Task 5: Full Regression Testing & Verification Before Completion
**Objective:** Execute all test suites, PowerShell syntax checks, and pre-commit verification checklist.

- [ ] Run full test suite across all `tests/*.js`.
- [ ] Run automated PowerShell syntax validation across all `game_modular/js/*.js` and `game_modular/data/*.json`.
- [ ] Verify strict BYN currency invariant (no `$`, `USD`, `руб`).
- [ ] Verify modal timer guards (`stopTimer()`).
- [ ] Final commit if any polish was needed.
