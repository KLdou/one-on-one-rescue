# 🧭 AGENTS.MD: Architecture, Code Standards & AI Guide
**Project:** "One on One: Rescue Simulator" (Volunteer curator simulator for "Zooshans", Minsk)  
**Spec:** Master GDD v2.2 ([`v2_2.md`](file:///d:/projects/volontiers/v2_2.md)) | **Active Codebase:** [`game_modular/`](file:///d:/projects/volontiers/game_modular)

---

## 1. Concept & Tech Stack
- **Genre:** Text roguelike survival, real-time time-management & animal rescue simulator with a turn-based acute phase.
- **Protagonist:** Everyday citizen of Minsk unexpectedly finding a stray animal with zero volunteer experience.
- **Platform:** Web SPA (Mobile-first) / Telegram WebApp.
- **Stack:** Vanilla HTML5, ES6+ JS, CSS3, Tailwind CSS (CDN). **No bundlers/npm build** (Webpack/Vite/React). Must run offline via `file://` or static web servers.
- **Real-world Conversion (Zooshans):** ERIP service code `4346991` (`https://zooshans.by/help-us`), Telegram `@zooshans_chat`, `@zooshans_info_bot`, Forum names `https://forum.zooshans.by/app.php/petnames`.

---

## 2. Directory Layout & Module Responsibilities
- `v2_2.md`: Master GDD (Single source of truth).
- `game_modular/`:
  - `index.html`: Base DOM layout, modal containers, Stories 9:16 viewport.
  - `css/styles.css`: Custom animations, layout tweaks, Stories frame.
  - `data/*.json`: Game balance & databases in BYN (`config.json`, `player_axes.json`, `coats.json`, `scenarios.json`, `petnames.json`, `calls.json`).
  - `js/`:
    - `data_loader.js`: Async loader + inline `window.GAME_DATA` fallback for `file://`; name & scenario generation.
    - `state.js`: Global `state`, calendar/seasons, litter energy formula, localStorage Album.
    - `engine.js`: Daily tick, 7-day trial loop, delayed red flags, social capital fundraising.
    - `events.js`: Modals for crises, piroplasmosis, trial returns (3-day grace period), naming.
    - `actions.js`: Clinic visits, tick drops, cat food sharing, naming actions, trial checks.
    - `adopters.js`: Calls pool, red flags, compromise (95%), trial transfers, foster reservations.
    - `ui.js`: DOM rendering, Album UI, educational defeat debriefs, Stories 9:16 generator.
    - `app.js`: Entry point (`window.onload`), bootstrap sequence.

---

## 3. Core Mechanics & Constraints (GDD v2.2)
- **Currency (Strictly BYN):** All prices, balances, and UI texts use **BYN** (never `$` or `USD`).
  - Monthly salaries (every 30d): `low` (280 start / +400 mo), `mid` (600 / +825 mo), `high` (1120 / +1500 mo).
  - Zooshans voucher: Max 1000 BYN (30-day term, 20% clinic discount).
  - Fundraising caps: Personal card max 6500 BYN/yr. Zooshans official account debt threshold >= 330 BYN (life-threatening surgeries/hospital only).
  - Living costs (14d supply): Cat 65 BYN, Dog/Litter 120 BYN, Royal Canin Babycat Milk 105 BYN (300g). Paid foster: Cat 16 BYN/day, Dog 33 BYN/day. Tick drops: 35 BYN/30 days.
- **Calendar & Seasons:** Starts at random date, advances +1 day per tick.
  - *Summer (Jun–Aug):* Kitten explosion (adult cat calls -75%, fosters full).
  - *Autumn (Sep–Nov):* Calls +25%; Oct 15–31 black cat adoption freeze (Halloween safety).
  - *Winter (Dec–Feb):* Dec 15–31 holiday impulse adoptions; street escape cold damage 2x.
  - *Spring (Mar–May):* Tick/piroplasmosis season (dogs require tick drops); pregnant cat surge.
- **6th Player Axis (Social Capital):** `introvert` (0.6x), `average_social` (1.0x), `wide_circle` (1.6x) multiplier on personal donations.
- **Naming Standard:** Forum convention (`petnames.json`): Given Name + Minsk District/Landmark (e.g., *"Abrikos Rokossovsky"*).
- **Litter Scaling Formula:**
  $$E_{reserve} = \lceil E_{base} \cdot (0.4 + 0.6 \cdot \frac{N_{active}}{N_{total}}) \rceil$$
  Feed consumption scales with $N_{active} / N_{total}$. Drops to `0⚡/day` when all kittens/puppies leave.
- **7-Day Trial Period & Delayed Strike:**
  - Foster spot hold: Free (-10⚡, 60% chance; 100% with 15 BYN sweets), Paid (50% weekly rate: 55 BYN cat / 110 BYN dog).
  - Delayed Red Flags: Never trigger instant defeat. Crisis strikes on day 3–5 or upon manual status check.
  - Surprise Return Grace Period: "Negotiate 3 days" (-15⚡, 65% chance; 90% with 20 BYN food buffer).
- **Meta-Progression & Debrief:** Rescued pets persist in `localStorage` ("Rescue Album"). Having >= 1 pet unlocks "Experienced Curator" toggle. Defeat presents an educational debrief on real volunteer errors.

---

## 4. Code Quality & Architecture Principles
- **Concise & Readable:** Write lean, idiomatic modern JavaScript (ES6+). Avoid bloat, boilerplate, and premature over-engineering.
- **Modular & Decoupled:**
  - Maintain single responsibility per module (UI rendering in `ui.js`, business rules in `engine.js`, state mutations in `state.js`).
  - Do not cross-pollinate DOM manipulation inside calculation routines or core state updates.
- **Deterministic & Testable:**
  - Separate pure calculation functions (e.g. litter scaling, cost calculations, chance resolutions) from side-effecting UI calls.
  - Make mechanics easy to isolate and verify through test scripts or assertions.
- **Defensive & Resilient:**
  - Always validate data presence (null/undefined checks for scenario lookups, coat patterns, array bounds).
  - Prevent divide-by-zero errors in ratio calculations (e.g. `N_total > 0 ? N_active / N_total : 0`).
- **Zero-Build Compatibility:**
  - Maintain vanilla browser compatibility. Do not introduce npm dependencies, import/export bundler syntax that breaks `file://` execution without testing, or Node-only APIs into runtime code.

---

## 5. Superpowers Skills Integration (Mandatory Workflows)
When modifying code or implementing features, strictly invoke and follow these Superpowers skills:
- **`brainstorming`:** Invoke before designing any new feature, mechanic, or major UX change. Explore options and align on solutions first.
- **`writing-plans` / `executing-plans`:** Create structured implementation plans before touching code on multi-step tasks.
- **`test-driven-development`:** Apply Red-Green-Refactor when implementing standalone logic, state calculations, or edge cases. Write test harnesses/assertions before implementation.
- **`systematic-debugging`:** When diagnosing bugs or regressions, systematically verify the problem, hypothesize root causes, and inspect data before altering code.
- **`verification-before-completion`:** Never mark a task complete without executing verification checks (syntax, runtime sanity, regression assertions).
- **`requesting-code-review` / `receiving-code-review`:** Critically evaluate logic against edge cases, GDD rules, and performance before closing tasks.
- **Mandatory Git Commit:** Always create a git commit after each completed task/feature/fix once verifications pass.

---

## 6. Pre-Commit Verification Checklist & Task Completion
1. **JSON & Fallback Sync:** Every modification to `data/*.json` MUST be immediately mirrored in `window.GAME_DATA` in `js/data_loader.js`.
2. **Automated Syntax Check:** Run PowerShell syntax validation after any edit:
   ```powershell
   Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
   Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
   ```
3. **Currency Invariant:** Verify all text and logs use **BYN** (no `$` or `USD`).
4. **Timer Guard:** Any modal dialog MUST call `stopTimer()` upon opening and hide active player buttons to prevent time skips during prompts.
5. **Commit After Completion:** Once all verifications pass, commit changes immediately with a descriptive message (e.g. `feat: ...`, `fix: ...`, `docs: ...`). Never leave finished tasks uncommitted.
