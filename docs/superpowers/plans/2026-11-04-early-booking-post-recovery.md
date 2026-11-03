# Early Booking Post-Recovery Contact & Drop Probability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement realistic post-recovery adopter follow-up for early-booked pets, where players can contact adopters once the pet recovers, with an adopter drop rate scaling dynamically with treatment duration.

**Architecture:**
- Extend `state.pr` with a structured `earlyBooking` object (`active`, `bookedOnDay`, `candidateName`, `notifiedReady`).
- Prevent immediate handover modals when a pet is currently in stationary, post-virus quarantine, trauma rehab, or active ringworm treatment; hold the booking during medical treatment.
- Implement `calculateEarlyBookingDropChance(waitDays)` that scales from 10% (short wait $\le 3$ days) up to 45% (long treatment $> 25$ days).
- Add an interactive card in the PR tab (`📞 Связаться с семьей по брони`) and prompt upon full medical recovery.
- Resolve outcome cleanly: either seamless trial transfer with Zooshans contract, or realistic graceful drop ("we couldn't wait and took another pet / circumstances changed") with curator mental strain and return to general adoption pool.

**Tech Stack:** Vanilla ES6+ JavaScript, Tailwind CSS classes, Node.js assert test harnesses.

**Spec:** Master GDD v2.2 ([`v2_2.md`](file:///d:/projects/volontiers/v2_2.md)), Sections 6.1, 7.3, 8.1.

## Global Constraints
- Currency strictly in **BYN** (never `$` or `USD`).
- Zero-build architecture (`file://` and static compatibility).
- Preserve existing backward compatibility for `state.pr.earlyBookedAdopterWaiting`.
- Pre-commit verification: all tests pass, syntax validation passes, commit after completion.

---

### Task 1: TDD Test Harness for Early Booking Drop Scaling & Recovery Contact
**Files:**
- Create: `tests/test_early_booking_recovery.js`

- [ ] Write tests covering:
  1. `calculateEarlyBookingDropChance(waitDays)` returns correct rates (10% for $\le 3$d, 18% for 4-7d, 25% for 8-14d, 35% for 15-25d, 45% for $>25$d).
  2. Storytelling booking while pet is in stationary/virus recovery does NOT force immediate transfer modal; sets `earlyBooking` state.
  3. Action `actionContactEarlyBookedAdopter` when pet is recovered triggers drop resolution:
     - On failure roll: adopter declines, drops booking, mental drops by 10, returns to PR.
     - On success roll: opens trial contract modal.
  4. Daily tick logs a reminder when medical recovery finishes while early booking is active.
- [ ] Run test with `node tests/test_early_booking_recovery.js` (expect failure).

### Task 2: State & Core Calculation Logic
**Files:**
- Modify: `game_modular/js/state.js`

- [ ] Add `earlyBooking` schema to `state.pr` initialization.
- [ ] Implement `isAnimalMedicallyRestricted()` helper (checks `inStationaryDaysLeft`, `virusRecoveryDaysLeft`, `traumaRehabDaysLeft`, `knownRingworm === true`).
- [ ] Implement `getEarlyBookingWaitDays()`.
- [ ] Implement `calculateEarlyBookingDropChance(waitDays)`.

### Task 3: Actions & Contact Resolution
**Files:**
- Modify: `game_modular/js/actions.js`
- Modify: `game_modular/js/events.js`

- [ ] In `actionStorytellingPost()`: when 12% booking rolls, check `isAnimalMedicallyRestricted()`.
  - If restricted, show gentle booking notice modal ("Семья готова ждать выздоровления") instead of immediate handover.
- [ ] Implement `actionContactEarlyBookedAdopter()`:
  - If still restricted: allows check-in call ("Лечение идет по графику, семья ждет").
  - If recovered: rolls `calculateEarlyBookingDropChance(waitDays)`.
  - Handles decline modal & state cleanup or success transfer modal.

### Task 4: Engine Recovery Notification & UI Button Integration
**Files:**
- Modify: `game_modular/js/engine.js`
- Modify: `game_modular/js/ui.js`

- [ ] In `engine.js`: add reminder log upon full recovery when `state.pr.earlyBooking.active` is true.
- [ ] In `ui.js`: render interactive card in PR tab (`📞 Семья по ранней брони`) with dynamic status badges.
- [ ] In `ui.js` deadlines radar: show badge if ready for contact.

### Task 5: Verification & Commit
- [ ] Run `node tests/test_early_booking_recovery.js` and all existing test suites.
- [ ] Run automated PowerShell syntax checks.
- [ ] Commit with message `feat: implement early booking recovery follow-up with duration-based drop chance`.
