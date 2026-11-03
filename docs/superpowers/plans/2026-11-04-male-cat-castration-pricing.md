# Male Cat Castration Pricing & UI Differentiation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Differentiate male cat castration pricing and UI terminology from female cat sterilization. Male cat castration costs 100 BYN base (80 BYN with Zooshans voucher 20% discount). Dogs remain unchanged at 300 BYN (240 BYN with voucher).

**Architecture:**
- Add `"castrateCat": 100` to `game_modular/data/config.json` and sync with `window.GAME_DATA.config.prices` in `game_modular/js/data_loader.js`.
- In `game_modular/js/ui.js` (`renderClinicModal`), determine gender-based procedure:
  - If male cat (`!g.isDog && a.gender === 'male'`): base price 100 BYN (80 BYN with voucher), title "Кастрация (кот)", badge "Кот", status "✓ Кастрирован", log "✂️ Кастрация кота проведена успешно!".
  - If female cat (`!g.isDog && a.gender !== 'male'`): base price 160 BYN (128 BYN with voucher), or 225 BYN (180 BYN) if pregnant.
  - Dog remains 300 BYN (240 BYN with voucher).
- Update master GDD `v2_2.md` with the new price entry.

**Tech Stack:** Vanilla ES6+ JavaScript, Tailwind CSS classes, Node.js assert test harnesses.

**Spec:** Master GDD v2.2 ([`v2_2.md`](file:///d:/projects/volontiers/v2_2.md)), AGENTS.md rules.

---

### Task 1: TDD Test for Castration vs Sterilization Pricing & Config Sync
**Files:**
- Create: `tests/test_cat_castration_pricing.js`

- [ ] Write tests covering:
  1. `config.json` contains `prices.castrateCat === 100`.
  2. `game_modular/js/data_loader.js` fallback `GAME_DATA.config.prices.castrateCat === 100`.
  3. Price resolution helper logic for:
     - Male cat: base 100 BYN, voucher discount 80 BYN ($100 \times 0.8$).
     - Female cat: base 160 BYN, voucher discount 128 BYN ($160 \times 0.8$).
     - Pregnant cat: base 225 BYN, voucher discount 180 BYN ($225 \times 0.8$).
     - Dog: base 300 BYN, voucher discount 240 BYN ($300 \times 0.8$).
- [ ] Run test with `node tests/test_cat_castration_pricing.js` (expect failure initially on missing key).

### Task 2: Config and Data Loader Sync
**Files:**
- Modify: `game_modular/data/config.json`
- Modify: `game_modular/js/data_loader.js`
- Modify: `v2_2.md`

- [ ] Add `"castrateCat": 100` to `game_modular/data/config.json`.
- [ ] Update `window.GAME_DATA` in `game_modular/js/data_loader.js` to match `config.json`.
- [ ] Update `v2_2.md` pricing section to document male cat castration (100 BYN / 80 BYN по талону) alongside female cat spay (160 BYN / 128 BYN).

### Task 3: Clinic UI Gender Differentiation
**Files:**
- Modify: `game_modular/js/ui.js`

- [ ] In `renderClinicModal` (around line 1172):
  - Check `isMaleCat = !g.isDog && a.gender === 'male'`.
  - Calculate `baseSpayCost`:
    - `g.isDog ? (prices.spayDog || 300) : (h.isPregnant ? (prices.spayPregnantCat || 225) : (isMaleCat ? (prices.castrateCat || 100) : (prices.spayCat || 160)))`.
  - Set title:
    - Pregnant: `'Экстренная стерилизация'`
    - Male cat: `'Кастрация (кот)'`
    - Dog: `'Стерилизация (собака)'`
    - Female cat: `'Стерилизация (кошка)'`
  - Set badge:
    - Pregnant: `'Срочно'`
    - Sterilized/Castrated: `'Сделано'`
    - Dog: `'Собака'`
    - Male cat: `'Кот'`
    - Female cat: `'Кошка'`
  - Set description subtext:
    - Pregnant: `'Экстренное прерывание беременности по медицинским показаниям.'`
    - Male cat: `'Плановая операция перед пристройством взрослого кота.'`
    - Default: `'Обязательная процедура перед пристройством взрослого подопечного.'`
  - Set status text:
    - Sterilized/Castrated: `isMaleCat ? '✓ Кастрирован' : '✓ Стерилизована'`
  - Update `payVetBill` name and log text:
    - Name: `isMaleCat ? 'Хирургическая кастрация (кот)' : 'Хирургическая стерилизация (' + g.shortNom + ')'`
    - Log: `isMaleCat ? '✂️ Кастрация кота проведена успешно! (На плановую операцию р/с «Зоошанса» не открывается — гасим своими средствами со скидкой 20% или сбором на карту).' : ...`

### Task 4: Verification and Pre-Commit Checks
**Files:**
- Execute verification suite

- [ ] Run test: `node tests/test_cat_castration_pricing.js`
- [ ] Run powershell syntax validation:
  ```powershell
  Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
  Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
  ```
- [ ] Run existing tests if any in `tests/` to ensure zero regressions.
- [ ] Commit changes with git.
