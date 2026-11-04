# Mobile Ergonomics & UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the mobile experience of "One on One: Rescue Simulator" into an ergonomic, one-handed mobile-first app with thumb-zone controls, safe-area support, compact header, Bottom Sheet modals, and accessible typography.

**Architecture:** Maintain zero-build vanilla JS/CSS architecture (`game_modular/`). Refactor responsive layout: compact single-row mobile header with a slide-over settings menu, safe-area aware bottom navigation with active tab states, bottom thumb-zone time/advance dock, Mobile Bottom Sheet for HUD resources, and bottom-anchored modal sheets for mobile viewports (`< 1024px`).

**Tech Stack:** Vanilla ES6+ JavaScript, CSS3 (Custom properties, Media Queries, Safe Area insets), Tailwind CDN, Telegram WebApp API (Haptics).

**Spec:** [Master GDD v2.2](file:///d:/projects/volontiers/v2_2.md) and [AGENTS.md](file:///d:/projects/volontiers/AGENTS.md).

## Global Constraints
- Currency strictly in **BYN** (never `$` or `USD`).
- Zero build tools (runs directly in browser via `file://` or static web servers).
- Pre-commit check: All JS must pass `node --check`. All JSON must validate.
- Timer Guard: Any modal or sheet prompt MUST call `stopTimer()` upon opening and hide active player buttons to prevent time skips during prompts.
- Offline and fallback compatibility: inline `window.GAME_DATA` sync preserved.

## Review Focus
- iPhone Home Indicator / Android navigation bar overlap: `padding-bottom: env(safe-area-inset-bottom)` must protect the bottom nav.
- Single-row mobile header: Header must not exceed 52px on mobile viewports (< 1024px), eliminating the 3-5 line wrapping bug.
- Thumb-zone time advancement: The "🌙 Завершить день" and pause/play controls must be reachable with one thumb in the lower third of the screen on mobile.
- Tooltip overflow on small screens: Resource explanations on mobile must render in a clean Bottom Sheet instead of overflowing 240px absolute tooltips.
- Active tab indication: Bottom tabs must clearly reflect the currently active section (`vet`, `zooshans`, `care`).

---

### Task 1: Viewport, Meta-Tags, Base Mobile CSS & Safe Area Variables

**Files:**
- Modify: `game_modular/index.html:4-10`
- Modify: `game_modular/css/styles.css:1-60`
- Test: `tests/mobile_meta_test.js`

**Interfaces:**
- Consumes: Browser viewport & CSS environment variables (`env(safe-area-inset-bottom)`).
- Produces: CSS variables `--sab`, `--sat`, anti-zoom `touch-action: manipulation`, overscroll containment, dynamic theme color.

- [ ] **Step 1: Write test for mobile viewport and base CSS variables**

Create `tests/mobile_meta_test.js` checking:
1. `index.html` contains `viewport-fit=cover`.
2. `index.html` contains `theme-color` meta tag.
3. `styles.css` contains `env(safe-area-inset-bottom)`.
4. `styles.css` defines `touch-action: manipulation` and `--sab` variable.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_meta_test.js`
Expected: FAIL (missing viewport-fit=cover and variables).

- [ ] **Step 3: Update `index.html` and `styles.css` with mobile viewport and safe-area foundation**

1. In `game_modular/index.html`:
   - Replace viewport meta with:
     `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />`
   - Add `<meta name="theme-color" content="#FAF6EE" id="metaThemeColor" />`.
2. In `game_modular/css/styles.css`:
   - Define `:root { --sab: env(safe-area-inset-bottom, 0px); --sat: env(safe-area-inset-top, 0px); }`.
   - Add `touch-action: manipulation;` and `overscroll-behavior-y: contain;` to `html, body, button`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_meta_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/index.html game_modular/css/styles.css tests/mobile_meta_test.js
git commit -m "fix(mobile): add viewport-fit=cover, safe area variables and touch optimization"
```

---

### Task 2: Compact Mobile Header & Quick Settings Menu

**Files:**
- Modify: `game_modular/index.html:14-118`
- Modify: `game_modular/css/styles.css:285-350`
- Modify: `game_modular/js/ui.js`
- Test: `tests/mobile_header_test.js`

**Interfaces:**
- Consumes: `state.day`, `state.calendarDate`, `state.currentSeason`.
- Produces: `toggleMobileSettingsMenu()`, `closeMobileSettingsMenu()`, single-line header on mobile.

- [ ] **Step 1: Write test for compact mobile header and settings menu**

Create `tests/mobile_header_test.js` verifying:
1. Mobile settings sheet container `#mobileSettingsSheet` exists in `index.html`.
2. Redundant buttons (`👤 Профиль`, `⏱️ Радар`) are hidden from mobile header.
3. Service buttons (`Альбом`, `Сценарии`, `Памятка`, `Новая`) are inside `#mobileSettingsSheet` on mobile.
4. Header container has a clean single-row mobile layout class.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_header_test.js`
Expected: FAIL.

- [ ] **Step 3: Implement compact mobile header layout and settings drawer**

1. In `game_modular/index.html`:
   - Group desktop-only service buttons with `hidden lg:flex`.
   - Add a mobile menu button (`btnMobileMenu`: `⚙️`) visible only on `< 1024px` (`lg:hidden`).
   - Add `#mobileSettingsSheet` modal sheet at the bottom of DOM containing buttons for:
     - 📖 Альбом спасенных хвостов
     - 📋 Выбор сценария
     - 💡 Памятка куратора
     - ↻ Начать новую игру
     - 🌓 Информация о сезоне и острой фазе
2. In `game_modular/css/styles.css`:
   - Ensure header on `< 1024px` has `height: 48px; max-height: 48px; flex-wrap: nowrap; overflow: hidden;` preventing wrapping.
3. In `game_modular/js/ui.js`:
   - Implement `openMobileSettingsMenu()` and `closeMobileSettingsMenu()` with backdrop.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_header_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/index.html game_modular/css/styles.css game_modular/js/ui.js tests/mobile_header_test.js
git commit -m "feat(mobile): compact single-line header and mobile settings sheet"
```

---

### Task 3: Bottom Navigation Safe Area & Active Tab Indication

**Files:**
- Modify: `game_modular/index.html:508-535`
- Modify: `game_modular/css/styles.css:452-470`
- Modify: `game_modular/js/ui.js:148-165, 840-870`
- Test: `tests/mobile_nav_test.js`

**Interfaces:**
- Consumes: `activeTab` ('vet', 'zooshans', 'care').
- Produces: `updateMobileNavUI(activeTab)` applying active styling (`active-mobile-tab`, emerald glow/pill).

- [ ] **Step 1: Write test for mobile bottom nav and active tab styling**

Create `tests/mobile_nav_test.js` checking:
1. `.mobile-bottom-nav` styles include `padding-bottom: var(--sab)`.
2. `switchTab('vet')` adds active class/attributes to `mobileTabBtn_vet`.
3. `switchTab('zooshans')` adds active class/attributes to `mobileTabBtn_zooshans` and removes from others.
4. `switchTab('care')` adds active class/attributes to `mobileTabBtn_care` and removes from others.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_nav_test.js`
Expected: FAIL.

- [ ] **Step 3: Implement safe area padding and active tab highlighting**

1. In `game_modular/css/styles.css`:
   - `.mobile-bottom-nav { height: calc(56px + var(--sab)); padding-bottom: var(--sab); }`
   - `body { padding-bottom: calc(72px + var(--sab)); }`
   - Define `.mobile-tab-btn.active { color: #047857; font-weight: 700; transform: translateY(-1px); }`
   - Define active indicator dot or pill.
2. In `game_modular/js/ui.js`:
   - In `switchTab(tabName)`:
     - Update classes and aria-selected on `mobileTabBtn_vet`, `mobileTabBtn_zooshans`, `mobileTabBtn_care`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_nav_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/index.html game_modular/css/styles.css game_modular/js/ui.js tests/mobile_nav_test.js
git commit -m "feat(mobile): safe area insets and active tab indicator in bottom nav"
```

---

### Task 4: Thumb-Zone Floating Action Dock (Advance Day & Time Controls)

**Files:**
- Modify: `game_modular/index.html`
- Modify: `game_modular/css/styles.css`
- Modify: `game_modular/js/ui.js`
- Test: `tests/mobile_fab_test.js`

**Interfaces:**
- Consumes: `state.onboarding.acutePhase`, `state.day`, `state.speed`.
- Produces: `#mobileTimeDock` in the bottom thumb zone above the bottom nav.

- [ ] **Step 1: Write test for mobile floating time dock**

Create `tests/mobile_fab_test.js` checking:
1. `#mobileTimeDock` element exists in the DOM.
2. In acute phase (`acutePhase === true`), dock displays prominent "🌙 Завершить день" button.
3. Outside acute phase, dock displays Play/Pause and speed toggles reachable by thumb.
4. When a modal opens (`showEventModal`, `showAnimalModal`), dock is hidden or disabled to satisfy Timer Guard.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_fab_test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `#mobileTimeDock` and sync with header controls**

1. In `game_modular/index.html`:
   - Add `#mobileTimeDock` positioned at `bottom: calc(60px + var(--sab));` on `< 1024px`.
   - Include mobile "🌙 Завершить день" button and compact speed pills.
2. In `game_modular/css/styles.css`:
   - Style `#mobileTimeDock` as a floating craft pill with backdrop-blur, subtle shadow, and thumb-friendly tap targets (>= 44px height).
3. In `game_modular/js/ui.js`:
   - Update `updateSpeedButtonsUI()` to keep both desktop header controls and mobile dock in sync.
   - Ensure `stopTimer()` and modal openers (`showEventModal`, `showAnimalModal`, etc.) hide `#mobileTimeDock`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_fab_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/index.html game_modular/css/styles.css game_modular/js/ui.js tests/mobile_fab_test.js
git commit -m "feat(mobile): thumb-zone floating action dock for time and day advancement"
```

---

### Task 5: Mobile HUD Resource Bottom Sheet (Replacing Tooltip Overflows)

**Files:**
- Modify: `game_modular/index.html`
- Modify: `game_modular/css/styles.css`
- Modify: `game_modular/js/ui.js`
- Test: `tests/mobile_bottom_sheet_test.js`

**Interfaces:**
- Consumes: `toggleResourceTooltip(tooltipId)`.
- Produces: `showResourceBottomSheet(resourceType)` on mobile viewports (< 1024px).

- [ ] **Step 1: Write test for resource bottom sheet on mobile**

Create `tests/mobile_bottom_sheet_test.js` checking:
1. `#resourceBottomSheet` exists in DOM with title, body, expense breakdown, and close button.
2. Calling `toggleResourceTooltip` when `window.innerWidth < 1024` opens `#resourceBottomSheet` instead of rendering overflowing `.resource-tooltip`.
3. Resource data matches current state (Budget in BYN, Mental %, Energy ⚡, Health %).

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_bottom_sheet_test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `#resourceBottomSheet` for mobile screens**

1. In `game_modular/index.html`:
   - Add `#resourceBottomSheet` at root modal level with grabber handle, title, description, balance details, and close button.
2. In `game_modular/css/styles.css`:
   - On screens `< 1024px`, suppress `.resource-tooltip` popup and route through Bottom Sheet animation (`translateY(100%)` to `0`).
3. In `game_modular/js/ui.js`:
   - In `toggleResourceTooltip(id)`: if `window.innerWidth < 1024`, call `openResourceBottomSheet(id)` with formatted Russian copy and BYN numbers.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_bottom_sheet_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/index.html game_modular/css/styles.css game_modular/js/ui.js tests/mobile_bottom_sheet_test.js
git commit -m "feat(mobile): replace overflowing tooltips with mobile resource bottom sheet"
```

---

### Task 6: Action Cards Ergonomics & Readability Overhaul

**Files:**
- Modify: `game_modular/css/styles.css:563-710`
- Modify: `game_modular/js/ui.js:2170-2260`
- Test: `tests/action_cards_ergonomics_test.js`

**Interfaces:**
- Consumes: `renderButtonGrid()`.
- Produces: Enhanced `.action-card` styles with >= 12px readable text, minimum 44px tap targets, and clean status differentiation on mobile.

- [ ] **Step 1: Write test for action card mobile typography and touch targets**

Create `tests/action_cards_ergonomics_test.js` verifying:
1. Mobile `.action-card__title` font size >= 12.5px.
2. Mobile `.action-card__body` font size >= 11px.
3. Cost badge elements meet tap/readability standards.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/action_cards_ergonomics_test.js`
Expected: FAIL.

- [ ] **Step 3: Update action card CSS rules and layout for mobile**

1. In `game_modular/css/styles.css`:
   - Under `@media (max-width: 1023px)`:
     - `.action-card { padding: 10px 12px; min-height: 84px; }`
     - `.action-card__title { font-size: 13px; line-height: 1.3; }`
     - `.action-card__body { font-size: 11.5px; line-height: 1.35; color: var(--text-primary); }`
     - `.badge-resource { font-size: 11px; padding: 2px 7px; border-radius: 6px; }`
2. In `game_modular/js/ui.js`:
   - Ensure completed and not-needed actions have clear visual distinction and don't overwhelm active cards.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/action_cards_ergonomics_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/css/styles.css game_modular/js/ui.js tests/action_cards_ergonomics_test.js
git commit -m "style(mobile): improve typography, contrast, and touch targets of action cards"
```

---

### Task 7: Mobile Bottom Sheet Modal Overlays & Telegram Haptics

**Files:**
- Modify: `game_modular/css/styles.css:470-520, 835-865`
- Modify: `game_modular/js/ui.js`
- Test: `tests/mobile_modals_haptics_test.js`

**Interfaces:**
- Consumes: `window.Telegram?.WebApp?.HapticFeedback`.
- Produces: `triggerHaptic(type)`, responsive bottom-sheet modal frames for `< 1024px`.

- [ ] **Step 1: Write test for mobile bottom sheet modal styles and haptics helper**

Create `tests/mobile_modals_haptics_test.js` checking:
1. `triggerHaptic(type)` function exists and safely handles absence of Telegram WebApp SDK without errors.
2. Modals on mobile have `border-radius: 20px 20px 0 0` and `align-self: flex-end`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile_modals_haptics_test.js`
Expected: FAIL.

- [ ] **Step 3: Implement mobile bottom sheet styles for modals and haptics**

1. In `game_modular/css/styles.css`:
   - Add mobile-specific rules for `.modal-card-custom` and `.modal-window`:
     - On `< 1024px`: `align-self: flex-end; width: 100%; max-height: 88vh; border-radius: 20px 20px 0 0; margin-bottom: 0; padding-bottom: calc(16px + var(--sab));`.
2. In `game_modular/js/ui.js`:
   - Add `triggerHaptic(type)` (`light`, `medium`, `success`, `warning`).
   - Wire `triggerHaptic('light')` into card clicks and `triggerHaptic('medium')` into `advanceAcuteDay()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile_modals_haptics_test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add game_modular/css/styles.css game_modular/js/ui.js tests/mobile_modals_haptics_test.js
git commit -m "feat(mobile): bottom-sheet modal presentation and telegram haptics"
```

---

### Task 8: Full Verification, Pre-Commit Checks & Regression Suite

**Files:**
- Run all test scripts in `tests/*.js`.
- Run automated PowerShell pre-commit checks:
  ```powershell
  Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
  Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
  ```
- Verify currency invariant (BYN).

- [ ] **Step 1: Run complete test suite**
- [ ] **Step 2: Execute automated syntax and JSON checks**
- [ ] **Step 3: Verify Timer Guard on all dialogs**
- [ ] **Step 4: Final commit and summary**
