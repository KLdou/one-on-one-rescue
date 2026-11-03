const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

// Test 1: JSON file exists and contains all 8 required hint IDs
const rawJson = fs.readFileSync(path.resolve(__dirname, '../game_modular/data/mentor_hints.json'), 'utf8');
const hints = JSON.parse(rawJson);
const requiredKeys = [
  'LOW_ENERGY_WARNING',
  'CLINIC_DEBT_HALFWAY',
  'QUARANTINE_BREACH_RISK',
  'REVACCINATION_OVERDUE',
  'STALE_PR_WARNING',
  'FIRST_TRIAL_STARTED',
  'ADOPTION_FAILED_POSTMORTEM',
  'SCAM_VICTIM_POSTMORTEM'
];

requiredKeys.forEach(k => {
  assert(hints[k], `Missing hint key: ${k}`);
  assert(hints[k].id === k, `Mismatch id for ${k}`);
  assert(['advice', 'post_mortem'].includes(hints[k].type), `Invalid type for ${k}`);
  assert(hints[k].title, `Missing title for ${k}`);
  assert(hints[k].message, `Missing message for ${k}`);
  assert(hints[k].rule, `Missing rule for ${k}`);
});
console.log('✓ Task 1: mentor_hints.json structure valid');

// Test 1b: Verify fallback in data_loader.js
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const domElements = {};
function getOrCreateElem(id) {
  if (!domElements[id]) {
    const isModalOrOverlay = id.toLowerCase().includes('modal') || id.toLowerCase().includes('overlay');
    const classSet = new Set(isModalOrOverlay ? ['hidden'] : []);
    domElements[id] = {
      id,
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        contains: (c) => classSet.has(c),
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) classSet.add(c); else classSet.delete(c);
            return force;
          }
          if (classSet.has(c)) { classSet.delete(c); return false; }
          classSet.add(c); return true;
        }
      },
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild: () => {},
      children: []
    };
  }
  return domElements[id];
}

const mockDocument = {
  body: {
    setAttribute: () => {},
    getAttribute: () => null,
    classList: { add: () => {}, remove: () => {} }
  },
  getElementById: (id) => getOrCreateElem(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    classList: { add: () => {}, remove: () => {} },
    innerHTML: '',
    textContent: '',
    appendChild: () => {},
    children: []
  })
};

const context = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  assert: assert,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  confirm: () => true
};
context.window = context;
vm.createContext(context);

const gameFiles = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/events.js',
  'game_modular/js/engine.js',
  'game_modular/js/actions.js',
  'game_modular/js/adopters.js',
  'game_modular/js/ui.js'
];

gameFiles.forEach(file => {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  vm.runInContext(code, context);
});

assert(context.window.GAME_DATA, 'window.GAME_DATA must exist');
assert(context.window.GAME_DATA.mentorHints, 'mentorHints missing from window.GAME_DATA fallback');
requiredKeys.forEach(k => {
  assert(context.window.GAME_DATA.mentorHints[k], `Missing fallback mentorHint in data_loader.js: ${k}`);
});
console.log('✓ Task 1: data_loader.js fallback window.GAME_DATA.mentorHints valid');

// Test 2: Meta-progress and localStorage persistence in state.js
// Ensure cross-realm array compatibility for Node 22 assert.deepStrictEqual
const _origGetUnlocked = context.getUnlockedMentorHints;
context.getUnlockedMentorHints = () => Array.from(_origGetUnlocked());

context.startNewRun(false);
assert.strictEqual(context.state.animal.daysSinceVaccine1, 0, 'daysSinceVaccine1 must be initialized to 0');
assert.strictEqual(context.state.animal.vaccineDewormLapse, false, 'vaccineDewormLapse must be initialized to false');
assert.deepStrictEqual(context.getUnlockedMentorHints(), [], 'Initial hints should be empty');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false);

const isNew = context.unlockMentorHint('LOW_ENERGY_WARNING');
assert.strictEqual(isNew, true, 'First unlock should return true');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true);
assert.strictEqual(context.unlockMentorHint('LOW_ENERGY_WARNING'), false, 'Duplicate unlock returns false');

// Restart run and verify hints are preserved
context.startNewRun(false);
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true, 'Hints must persist across runs');

// Reset progress
context.resetMentorProgress();
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), false, 'Hints should be cleared after reset');
console.log('✓ Task 2: Meta-progress and localStorage persistence verified');

// Test 3: Triggers verification
// 1. LOW_ENERGY_WARNING
context.startNewRun(false);
context.resetMentorProgress();
context.state.energy = 25;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), 'LOW_ENERGY_WARNING should trigger at energy <= 25');

// 2. CLINIC_DEBT_HALFWAY
context.state.zooshans.voucherDebt = 500;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('CLINIC_DEBT_HALFWAY'), 'CLINIC_DEBT_HALFWAY should trigger at debt >= 500');

// 3. QUARANTINE_BREACH_RISK
context.state.player.ownPets = { id: 'unvaccinated_cat' };
context.state.zooshans.locationStatus = 'home_floor';
context.state.animal.species = 'cat';
context.state.animal.quarantineDaysDone = 0;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('QUARANTINE_BREACH_RISK'), 'QUARANTINE_BREACH_RISK should trigger with unvax cat on floor');

// 4. REVACCINATION_OVERDUE (past 28 days)
context.state.animal.parasitesAndVaccinated = true;
context.state.animal.daysSinceVaccine1 = 29;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('REVACCINATION_OVERDUE'), 'REVACCINATION_OVERDUE triggers past 28 days');

// 4b. REVACCINATION_OVERDUE (deworm lapse)
context.resetMentorProgress();
context.state.animal.daysSinceVaccine1 = 5;
context.state.animal.vaccineDewormLapse = true;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('REVACCINATION_OVERDUE'), 'REVACCINATION_OVERDUE triggers on vaccineDewormLapse');

// 5. STALE_PR_WARNING (refresh > 14 days)
context.state.animal.vaccineDewormLapse = false;
context.state.pr.prActive = true;
context.state.pr.daysSinceAdRefresh = 15;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('STALE_PR_WARNING'), 'STALE_PR_WARNING triggers when PR refresh > 14 days');

// 5b. STALE_PR_WARNING (ageDays >= 180 and !isSterilized)
context.resetMentorProgress();
context.state.pr.prActive = true;
context.state.pr.daysSinceAdRefresh = 3;
context.state.animal.ageDays = 180;
context.state.animal.isSterilized = false;
context.checkMentorTriggers();
assert(context.isMentorHintUnlocked('STALE_PR_WARNING'), 'STALE_PR_WARNING triggers when age >= 180 and not sterilized');

// 6. FIRST_TRIAL_STARTED
context.resetMentorProgress();
context.finishTransferToTrial(1, { candidateName: 'Тест', source: 'Куфар' }, {}, false);
assert(context.isMentorHintUnlocked('FIRST_TRIAL_STARTED'), 'FIRST_TRIAL_STARTED should trigger on trial transfer');

// 7. ADOPTION_FAILED_POSTMORTEM
context.resetMentorProgress();
const mockTrialItem = {
  petName: 'Тест',
  count: 1,
  fosterSpotHeld: true,
  fosterLocation: 'home_cage',
  callData: { id: 'call_test' }
};
context.triggerTrialReturnModal(mockTrialItem);
assert(context.isMentorHintUnlocked('ADOPTION_FAILED_POSTMORTEM'), 'ADOPTION_FAILED_POSTMORTEM triggers on trial return');

// 8. SCAM_VICTIM_POSTMORTEM
context.resetMentorProgress();
context.window.currentCandidateCall = {
  isScam: true,
  scamLossBYN: 80,
  consequenceText: 'Мошенники'
};
context.actionAcceptCandidate(false, {});
assert(context.isMentorHintUnlocked('SCAM_VICTIM_POSTMORTEM'), 'SCAM_VICTIM_POSTMORTEM triggers on scam consequence');
if (typeof context.closeEventModal === 'function') context.closeEventModal();
if (typeof context.closeMentorModal === 'function') context.closeMentorModal();

// 9. ProcessDayTick increments daysSinceVaccine1 and checks triggers
context.resetMentorProgress();
context.state.animal.parasitesAndVaccinated = true;
context.state.animal.daysSinceVaccine1 = 10;
context.state.energy = 20;
context.processDayTick();
assert.strictEqual(context.state.animal.daysSinceVaccine1, 11, 'processDayTick should increment daysSinceVaccine1');
assert(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), 'processDayTick should trigger LOW_ENERGY_WARNING');

// 10. spendEnergy calls checkMentorTriggers
context.resetMentorProgress();
context.state.energy = 30;
context.spendEnergy(10);
assert.strictEqual(context.state.energy, 20);
assert(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), 'spendEnergy should invoke checkMentorTriggers');

// 11. payVetBill calls checkMentorTriggers on debt increase
context.resetMentorProgress();
context.state.energy = 100;
context.state.zooshans.applicationSubmitted = true;
context.state.zooshans.clinicMode = 'major_voucher';
context.state.zooshans.voucherDebt = 480;
context.payVetBill(50, true, 'Осмотр');
assert(context.isMentorHintUnlocked('CLINIC_DEBT_HALFWAY'), 'payVetBill should trigger CLINIC_DEBT_HALFWAY when debt >= 500');

console.log('✓ Task 3: All 8 reactive mentor triggers and integrations verified');

// Test 4: Mentor modal queue and Timer Guard in ui.js
context.startNewRun(false);
context.closeEventModal();
if (typeof context.closeAnimalModal === 'function') context.closeAnimalModal();
if (typeof context.closeMentorModal === 'function') {
  while (context.mentorHintQueue && context.mentorHintQueue.length > 0) {
    context.mentorHintQueue.shift();
  }
  context.closeMentorModal();
}
context.resetMentorProgress();
context.state.onboarding.acutePhase = false;
context.setSpeed(2);
assert(context.currentSpeed > 0, 'Speed should be active');

const triggered = context.triggerMentorHint('LOW_ENERGY_WARNING');
assert.strictEqual(triggered, true, 'triggerMentorHint should return true on first display');
assert.strictEqual(context.currentSpeed, 0, 'Timer must be stopped when mentor modal opens');
assert.strictEqual(context.isMentorHintUnlocked('LOW_ENERGY_WARNING'), true, 'Hint marked unlocked');

// Advice styling checks
const badgeEl = context.document.getElementById('mentorModalBadge');
assert.strictEqual(badgeEl.textContent, '💡 Совет координатора');
assert(badgeEl.className.includes('bg-emerald-600'), 'Advice badge should be emerald');
const ruleBoxEl = context.document.getElementById('mentorModalRuleBox');
assert(ruleBoxEl.className.includes('bg-emerald-50'), 'Advice rule box should be emerald');
const btnEl = context.document.getElementById('btnMentorDismiss');
assert(btnEl.className.includes('bg-emerald-600'), 'Advice dismiss button should be emerald');
const iconEl = context.document.getElementById('mentorModalSpeakerIcon');
assert.strictEqual(iconEl.textContent, '👤');

// Queue check: trigger a second hint while first is open
let secondDismissed = false;
const secondTriggered = context.triggerMentorHint('REVACCINATION_OVERDUE', () => {
  secondDismissed = true;
});
assert.strictEqual(secondTriggered, true, 'Second hint should be accepted into queue');
assert.strictEqual(context.mentorHintQueue.length, 1, 'Queue should hold the second hint');
assert.strictEqual(context.isMentorHintUnlocked('REVACCINATION_OVERDUE'), true, 'Second hint should also be unlocked');

// Close first modal -> second should pop from queue
context.closeMentorModal();
assert.strictEqual(context.mentorHintQueue.length, 0, 'Queue should be empty after popping next hint');
assert.strictEqual(secondDismissed, false, 'Second callback should not fire yet');

// Post-mortem styling checks on popped modal
assert.strictEqual(badgeEl.textContent, '⚠️ Разбор полетов');
assert(badgeEl.className.includes('bg-rose-600'), 'Post-mortem badge should be rose');
assert(ruleBoxEl.className.includes('bg-amber-50'), 'Post-mortem rule box should be amber');
assert(btnEl.className.includes('bg-rose-600'), 'Post-mortem dismiss button should be rose');
assert.strictEqual(iconEl.textContent, '🔍');

// Close second modal -> second callback fires
context.closeMentorModal();
assert.strictEqual(secondDismissed, true, 'Second callback must fire when second modal is closed');

// Duplicate check without forceShow
const dupTriggered = context.triggerMentorHint('LOW_ENERGY_WARNING', null, false);
assert.strictEqual(dupTriggered, false, 'Already unlocked hint should return false if forceShow is false');

console.log('✓ Task 4: Mentor modal queue and Timer Guard verified');

// Test 5: Mentor archive modal and counter update
context.resetMentorProgress();
context.unlockMentorHint('LOW_ENERGY_WARNING');
context.unlockMentorHint('FIRST_TRIAL_STARTED');

const unlockedList = context.getUnlockedMentorHints();
assert.strictEqual(unlockedList.length, 2, 'Should have 2 unlocked hints');

context.renderMentorArchive();
const countElem = context.document.getElementById('headerMentorCount');
assert.strictEqual(countElem.textContent, '2/8', 'Header counter should show 2/8');

// Test modal open/close and Timer Guard
context.setSpeed(2);
assert(context.currentSpeed > 0, 'Speed must be > 0 before openMentorArchiveModal');
context.openMentorArchiveModal();
assert.strictEqual(context.currentSpeed, 0, 'openMentorArchiveModal must stop timer');
const archiveModal = context.document.getElementById('mentorArchiveModal');
assert.strictEqual(archiveModal.classList.contains('hidden'), false, 'mentorArchiveModal must be visible');
context.closeMentorArchiveModal();
assert.strictEqual(archiveModal.classList.contains('hidden'), true, 'mentorArchiveModal must be hidden after close');

// Test reset
context.resetMentorProgress();
assert.strictEqual(context.getUnlockedMentorHints().length, 0, 'Should have 0 hints after reset');
context.renderMentorArchive();
assert.strictEqual(countElem.textContent, '0/8', 'Header counter should reset to 0/8');

// Test confirmResetMentorProgress
context.unlockMentorHint('REVACCINATION_OVERDUE');
context.updateHeaderMentorCounter();
assert.strictEqual(countElem.textContent, '1/8', 'Counter should be 1/8 before confirm reset');
context.confirmResetMentorProgress();
assert.strictEqual(context.getUnlockedMentorHints().length, 0, 'Hints should be 0 after confirmResetMentorProgress');
assert.strictEqual(countElem.textContent, '0/8', 'Counter should be 0/8 after confirmResetMentorProgress');

console.log('✓ Task 5: Mentor archive and counter update verified');

// Test 6: shownHints cooldown & backward compatibility
context.resetMentorProgress();
context.startNewRun();
context.state.energy = 20;
assert(!context.state.shownHints['LOW_ENERGY_WARNING'], 'LOW_ENERGY_WARNING should not be in shownHints yet');
context.checkMentorTriggers();
assert(context.state.shownHints['LOW_ENERGY_WARNING'], 'LOW_ENERGY_WARNING should be recorded in shownHints');
assert(context.state.mentorHistory.includes('LOW_ENERGY_WARNING'), 'LOW_ENERGY_WARNING should be in mentorHistory');

// Simulate repeated tick with low energy: must not re-trigger or queue duplicate
const queueLenBefore = context.mentorHintQueue ? context.mentorHintQueue.length : 0;
context.checkMentorTriggers();
const queueLenAfter = context.mentorHintQueue ? context.mentorHintQueue.length : 0;
assert.strictEqual(queueLenBefore, queueLenAfter, 'checkMentorTriggers must not spam hint queue on subsequent ticks');

// Backward compatibility check for legacy saves
const legacyState = {
  day: 10,
  cash: 500,
  animal: { species: 'cat' },
  zooshans: {}
};
context.ensureStateBackwardCompatibility(legacyState);
assert(legacyState.playerAxes, 'ensureStateBackwardCompatibility must attach playerAxes');
assert(legacyState.player && legacyState.player.income, 'ensureStateBackwardCompatibility must attach default player perks');
assert(typeof legacyState.shownHints === 'object', 'shownHints must be an object');
assert(Array.isArray(legacyState.mentorHistory), 'mentorHistory must be an array');
assert.strictEqual(legacyState.animal.volunteerHandlesDeworming, false, 'volunteerHandlesDeworming must be boolean false');
assert.strictEqual(legacyState.zooshans.tempVolunteerDaysLeft, 0, 'tempVolunteerDaysLeft must default to 0');
console.log('✓ Task 6: shownHints cooldown and backward compatibility verified');



