# Personal Cat Vaccination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a vet action button in the «🏥 Ветеринария» tab enabling players who chose the "Мой свой кот (НЕ ПРИВИТ!)" axis to vaccinate their personal pet for 60 BYN and 10⚡, permanently removing the critical infection risk (-215 BYN and -30% mental penalty).

**Architecture:**
- Zero-build vanilla ES6+ (runnable directly in browser / `file://`).
- Currency is strictly **BYN** (never `$`, `USD`, or `руб`).
- Synchronize all `data/*.json` updates with `window.GAME_DATA` in `data_loader.js` (if modified).
- Respect Timer Guard on all dialogs (`stopTimer()`).
- Automated syntax validation on all JS and JSON files after edits.

**Spec / Requirements:**
- Button title: «💉 Вакцинация домашнего кота»
- Location: Tab «🏥 Ветеринария» (`tabContent_vet`)
- Cost: 60 BYN (personal funds, not eligible for Zooshans voucher) and 10⚡
- Condition: Active when player has `state.player.ownPets.id === 'unvaccinated_cat'`
- Effect:
  - Updates `state.player.ownPets.id = 'vaccinated_cat'`
  - Updates `state.player.ownPets.label = 'Мой свой кот (привит)'`
  - Updates `state.player.ownPets.infectionRisk = 'low'`
  - Records `state.player.ownPets.vaccinatedAtDay = state.day`
  - Displays state `completed` with badge `✓ Привит` once done
  - Prevents -215 BYN treatment penalty and -30% mental loss on tactile contamination in `events.js:83`

## Global Constraints
- Strictly vanilla HTML5, CSS3, ES6+ JavaScript. No npm build tools or bundlers.
- Currency formatted with `BYN`.
- Automated PowerShell syntax check after every modification:
  `Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }`
  `Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }`

## Review Focus
1. Vaccination button strictly uses personal cash (`state.cash`), never voucher debt (`isVoucherEligible: false`).
2. Does not show button if player chose `ownPets.id === 'none'` or already started with a vaccinated cat without needing re-vaccination.
3. State transition from `unvaccinated_cat` to `vaccinated_cat` immediately nullifies the infection hazard in `events.js:83` and mentor alert in `engine.js:442`.
4. Insufficient funds (< 60 BYN) or energy (< 10⚡) correctly flags card as `insufficient` and blocks execution safely.

---

## File Structure & Responsibilities

| File | Purpose / Changes |
| --- | --- |
| `game_modular/js/actions.js` | Implement `actionVaccinateOwnCat()` with cash/energy checks and state updates. |
| `game_modular/js/ui.js` | Add «Вакцинация домашнего кота» action card in `renderActionTabs` under `vetButtons`. |
| `tests/test_vaccinate_own_cat.js` | TDD suite verifying button display, execution, edge cases, and infection penalty prevention. |

---

## Tasks

### Task 1: Personal Cat Vaccination Action and UI Integration
**Objective:** Implement `actionVaccinateOwnCat()` and add the action card in the Vet tab.

- [ ] **Step 1: Write the failing test**
Create `tests/test_vaccinate_own_cat.js` testing:
  - When `state.player.ownPets.id === 'unvaccinated_cat'`, button «Вакцинация домашнего кота» is present in `vetButtons` with cost 60 BYN, 10⚡, `isVoucherEligible: false`.
  - When executed with sufficient funds and energy:
    - Deducts 60 BYN from `state.cash` and adds 60 to `state.personalMoneySpent`.
    - Spends 10⚡.
    - Transitions `state.player.ownPets.id` to `'vaccinated_cat'` and `infectionRisk` to `'low'`.
    - Button switches to `'completed'` state.
  - When executed with insufficient funds (`state.cash < 60`), blocks action and does not deduct energy or change state.
  - When executed with insufficient energy (`state.energy < 10`), blocks action.
  - Verifies that after vaccination, virus outbreak in `events.js` does NOT trigger the 215 BYN penalty.
  - When `state.player.ownPets.id === 'none'`, button is not displayed.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_vaccinate_own_cat.js`
Expected: FAIL (`actionVaccinateOwnCat` not defined).

- [ ] **Step 3: Implement `actionVaccinateOwnCat` in `game_modular/js/actions.js` and render in `game_modular/js/ui.js`**
  - In `actions.js`:
    ```javascript
    function actionVaccinateOwnCat() {
      if (state.gameOver) return;
      const p = state.player;
      if (!p || !p.ownPets || p.ownPets.id !== 'unvaccinated_cat') {
        addLog(`День ${state.day}: У вас нет непривитого домашнего кота!`, 'warn');
        return;
      }
      if (state.cash < 60) {
        addLog(`День ${state.day}: Не хватает средств (60 BYN) на вакцинацию домашнего кота!`, 'warn');
        return;
      }
      if (!spendEnergy(10)) return;
      state.cash = +(state.cash - 60).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + 60).toFixed(1);
      p.ownPets.id = 'vaccinated_cat';
      p.ownPets.label = 'Мой свой кот (привит)';
      p.ownPets.infectionRisk = 'low';
      p.ownPets.vaccinatedAtDay = state.day;
      addLog(`День ${state.day}: 💉 Домашний кот успешно привит в клинике (комплексная вакцина + ветпаспорт, -60 BYN)! Критический риск заражения снят.`, 'success');
      renderAll();
    }
    window.actionVaccinateOwnCat = actionVaccinateOwnCat;
    ```
  - In `ui.js`:
    In `renderActionTabs`, within `vetButtons`:
    ```javascript
    const hasUnvacOwnCat = Boolean(state.player && state.player.ownPets && state.player.ownPets.id === 'unvaccinated_cat');
    const wasOwnCatVaccinatedInGame = Boolean(state.player && state.player.ownPets && state.player.ownPets.id === 'vaccinated_cat' && state.player.ownPets.vaccinatedAtDay);
    if (hasUnvacOwnCat) {
      vetButtons.push({
        icon: '💉',
        title: 'Вакцинация домашнего кота',
        badge: 'Свой кот',
        sub: 'Комплексная прививка личного питомца. Снимает критический риск заражения (-215 BYN и -30% 🧠) при срыве карантина.',
        costBYN: 60,
        costEnergy: 10,
        isVoucherEligible: false,
        state: 'active',
        statusText: '',
        onClick: actionVaccinateOwnCat
      });
    } else if (wasOwnCatVaccinatedInGame) {
      vetButtons.push({
        icon: '💉',
        title: 'Вакцинация домашнего кота',
        badge: 'Привит',
        sub: 'Домашний кот привит в клинике: иммунитет против вирусов активен.',
        costBYN: 0,
        costEnergy: 0,
        isVoucherEligible: false,
        state: 'completed',
        statusText: '✓ Привит в клинике',
        onClick: null
      });
    }
    ```

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_vaccinate_own_cat.js`
Expected: PASS.

- [ ] **Step 5: Run automated syntax checks & commit**
Run PowerShell syntax checks and commit:
`feat(vet): add personal cat vaccination action and UI card in vet tab`

---

### Task 2: Regression Testing & Final Review
**Objective:** Run the complete test suite (27 suites) and verify all invariants.

- [ ] Run all test files: `Get-ChildItem -Path "tests/*.js" | ForEach-Object { node $_.FullName }`
- [ ] Run automated PowerShell syntax validation across all `game_modular/js/*.js` and `game_modular/data/*.json`.
- [ ] Verify strictly BYN currency.
- [ ] Final whole-branch review.
