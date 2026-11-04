# Адаптивный мобильный каркас (Sticky Top HUD + Thumb-zone Bottom Dock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a sleek, thumb-friendly mobile layout (< 1024px) with sticky top HUD (pet header + 4-resource compact bar) and fixed bottom dock (time controller + 4 main tabs: Actions, Supply, Radar, Base), while preserving the full 3-column desktop layout (>= 1024px).

**Architecture:** 
1. In `game_modular/css/styles.css`, introduce CSS custom properties and media query rules (`< 1024px`) for `.mobile-top-sticky`, `.hud-bar`, `.mobile-main-content`, and `.mobile-bottom-dock` using theme variables, ensuring desktop (`>= 1024px`) hides mobile docks.
2. In `game_modular/index.html`, integrate `.mobile-top-sticky` (pet header + 4-resource compact bar) and `.mobile-bottom-dock` (time controller + 4 bottom tabs) alongside mobile-tab containers (`#mobileTab_actions`, `#mobileTab_supply`, `#mobileTab_radar`, `#mobileTab_base`), while keeping desktop layout intact.
3. In `game_modular/js/ui.js`, add `switchMobileTab(tabId)`, wire up time controls, and extend `renderHUD()` / `renderDeadlines()` to dynamically update mobile HUD values, progress bar widths, and deadline badge counter.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Tailwind CSS (CDN). No bundlers, fully compatible with `file://`.

**Spec:** [`docs/superpowers/specs/2026-11-04-mobile-hud-dock-redesign.md`](file:///d:/projects/volontiers/docs/superpowers/specs/2026-11-04-mobile-hud-dock-redesign.md)

## Global Constraints
- Currency strictly BYN (never `$` or `USD`).
- Zero build tools/bundlers; pure browser ES6+.
- Desktop 3-column layout (`>= 1024px`) must remain 100% functional and intact.
- Safe Area insets (`env(safe-area-inset-bottom)`) must be respected on mobile docks.
- Automated verification: `node --check` on all JS files before completing tasks.

## Review Focus
1. Divide-by-zero or NaN in progress bars when budget or energy limits are 0.
2. Safe-area bottom padding prevents bottom tabs from overlapping iPhone home bar or obscuring main content cards.
3. Speed controls and "🌙 Завершить день" correctly switch visibility between acute phase (days 1-3) and calm phase (day >= 4).
4. Radar badge count reflects active deadlines and updates dynamically when deadlines are added or resolved.
5. Opening and closing modals (`showAnimalModal`, etc.) correctly stops time and doesn't get occluded by sticky bars.

---

### Task 1: CSS Architecture & Theme Variables for Mobile HUD & Dock

**Files:**
- Modify: `game_modular/css/styles.css`
- Test: `tests/test_mobile_layout.js`

**Interfaces:**
- Consumes: CSS variables `--bg-card`, `--bg-elevated`, `--text-primary`, `--text-muted`, `--border-subtle`
- Produces: CSS classes `.mobile-top-sticky`, `.app-header`, `.hud-bar`, `.hud-item`, `.hud-progress`, `.mobile-bottom-dock`, `.time-controller-bar`, `.speed-btn`, `.end-day-btn`, `.bottom-nav`, `.nav-tab` with responsive desktop guards (`lg:hidden` / `display: none !important`)

- [ ] **Step 1: Write test checking required CSS classes and desktop guards**
Create `tests/test_mobile_layout.js` checking that `styles.css` defines the required selectors (`.mobile-top-sticky`, `.hud-bar`, `.mobile-bottom-dock`, `.time-controller-bar`, `.bottom-nav`), defines `--top-hud-height` and `--bottom-dock-height`, and sets `display: none` for desktop screens (`min-width: 1024px`).

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_mobile_layout.js`
Expected: FAIL (selectors or variables missing).

- [ ] **Step 3: Implement CSS rules in `game_modular/css/styles.css`**
Add:
- `:root` definitions: `--top-hud-height: 98px;`, `--bottom-dock-height: 116px;`, `--bg-surface`, etc.
- `@media (max-width: 1023px)` rules for `.mobile-top-sticky`, `.app-header`, `.pet-quick-btn`, `.hud-bar`, `.hud-item`, `.hud-progress`, `.fill.budget`, `.fill.mental`, `.fill.energy`, `.fill.locked`, `.fill.health`, `.mobile-main-content`, `.mobile-bottom-dock`, `.time-controller-bar`, `.speed-btn`, `.end-day-btn`, `.bottom-nav`, `.nav-tab`, `.nav-badge`.
- `@media (min-width: 1024px)` rules ensuring `.mobile-top-sticky` and `.mobile-bottom-dock` are hidden.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_mobile_layout.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add game_modular/css/styles.css tests/test_mobile_layout.js
git commit -m "style: add responsive styles and variables for mobile hud and bottom dock"
```

---

### Task 2: DOM Structure in `game_modular/index.html`

**Files:**
- Modify: `game_modular/index.html`
- Test: `tests/test_mobile_dom.js`

**Interfaces:**
- Consumes: CSS classes from Task 1
- Produces: DOM elements `#mobileTopSticky`, `#mobileHudCashVal`, `#mobileHudMentalVal`, `#mobileHudEnergyVal`, `#mobileHudHealthVal`, `#mobileBottomDock`, `#mobileBtnSpeed0/1/2/5`, `#mobileEndDayBtn`, `#mobileTabBtn_actions/supply/radar/base`, `#mobileTab_actions/supply/radar/base`

- [ ] **Step 1: Write test for required mobile DOM elements**
Create `tests/test_mobile_dom.js` verifying that `index.html` contains the new mobile sticky top container, the 4-item HUD bar with tooltips and progress bars, the mobile bottom dock with time controls and 4 tabs, and the 4 mobile tab containers.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_mobile_dom.js`
Expected: FAIL (elements not found).

- [ ] **Step 3: Integrate `.mobile-top-sticky` and `.mobile-bottom-dock` in `game_modular/index.html`**
- Insert `<div id="mobileTopSticky" class="mobile-top-sticky lg:hidden">` at the top of the body before main content.
- Restructure the mobile layout into 4 tab sections:
  - Tab 1: `mobileTab_actions` (contains banners, event dialog `#eventOverlayBox`, and actions dashboard `#actionsDashboard`).
  - Tab 2: `mobileTab_supply` (contains supplies, foster status, babycat milk, paid foster button, card collection limit, and Zooshans voucher debt).
  - Tab 3: `mobileTab_radar` (contains deadlines radar list and curator chronicle log).
  - Tab 4: `mobileTab_base` (contains pet card quick button, mentor notes archive, rescue album, and Zooshans ERIP/chat contacts).
- Insert `<div id="mobileBottomDock" class="mobile-bottom-dock lg:hidden">` containing `.time-controller-bar` and `.bottom-nav`.
- Remove or cleanly replace legacy mobile dock (`#mobileTimeDock` and `.mobile-bottom-nav`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_mobile_dom.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add game_modular/index.html tests/test_mobile_dom.js
git commit -m "feat(ui): add mobile sticky header, 4-stat hud, and 4-tab thumb dock to index.html"
```

---

### Task 3: JS Navigation & State Synchronization in `game_modular/js/ui.js`

**Files:**
- Modify: `game_modular/js/ui.js`
- Test: `tests/test_mobile_ui_sync.js`

**Interfaces:**
- Consumes: `state` from `js/state.js`, DOM elements from Task 2
- Produces: `switchMobileTab(tabId)`, updated `renderHUD()`, updated `renderDeadlines()`, synchronized `setSpeed(speed)` and `advanceAcuteDay()`

- [ ] **Step 1: Write test for JS tab navigation, HUD rendering, and deadline badge**
Create `tests/test_mobile_ui_sync.js` to simulate:
- Calling `switchMobileTab('supply')`: asserts active classes on tab button and visibility on tab container.
- Calling `renderHUD()`: asserts that `#mobileHudCashVal`, `#mobileHudMentalVal`, `#mobileHudEnergyVal`, `#mobileHudHealthVal` and their respective `.fill.*` widths match state.
- Calling `renderDeadlines()`: asserts that `#mobileRadarBadge` displays the count of active deadlines (or hides when 0).
- Checking speed controls and acute day button during acute phase vs calm phase.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_mobile_ui_sync.js`
Expected: FAIL (functions not yet implemented or elements not bound).

- [ ] **Step 3: Implement `switchMobileTab`, update `renderHUD` and handlers in `game_modular/js/ui.js`**
- Implement `switchMobileTab(tabId)`: manages active class on `#mobileTabBtn_*` and toggles `.hidden` on `#mobileTab_*`.
- In `renderHUD()`: update mobile pet avatar/name/day/phase, mobile budget text + `.fill.budget` width, mobile mental text + `.fill.mental` width, mobile energy text (`X/Y🔒`) + `.fill.energy`/`.fill.locked` widths, mobile health text + `.fill.health` width.
- In `renderDeadlines()`: update `.nav-badge` counter on `#mobileRadarBadge`.
- In `setSpeed()` and `advanceAcuteDay()`: keep mobile speed buttons and acute day button synced.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_mobile_ui_sync.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add game_modular/js/ui.js tests/test_mobile_ui_sync.js
git commit -m "feat(ui): implement mobile tab navigation and reactive hud state binding"
```

---

### Task 4: Full System Verification, Responsiveness & Pre-Commit Audit

**Files:**
- Test: All tests in `tests/*.js`
- Validate: All files in `game_modular/js/*.js` and `game_modular/data/*.json`

**Interfaces:**
- Consumes: Complete game app
- Produces: Verified production-ready mobile HUD & dock integration

- [ ] **Step 1: Run comprehensive automated test suite**
Run:
```powershell
node tests/test_mobile_layout.js
node tests/test_mobile_dom.js
node tests/test_mobile_ui_sync.js
```
Expected: All tests PASS.

- [ ] **Step 2: Run syntax checks across the codebase**
Run:
```powershell
Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
```
Expected: Zero errors.

- [ ] **Step 3: Verify Currency Invariant (Strictly BYN)**
Run search for unauthorized `$` or `USD` in player-facing UI text.
Expected: Zero occurrences.

- [ ] **Step 4: Final verification commit**
```bash
git add -A
git commit -m "chore: verify mobile sticky hud and dock integration across tests and syntax checks"
```
