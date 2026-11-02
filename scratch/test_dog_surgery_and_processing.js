// scratch/test_dog_surgery_and_processing.js
const fs = require('fs');

class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (...cls) => { cls.forEach(c => this.classList._classes.add(c)); this.className = Array.from(this.classList._classes).join(' '); },
      remove: (...cls) => { cls.forEach(c => this.classList._classes.delete(c)); this.className = Array.from(this.classList._classes).join(' '); },
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c)
    };
    this.style = {};
    this.attributes = {};
    this.disabled = false;
    this.title = '';
    this.textContent = '';
    this.innerHTML = '';
    this.children = [];
    this.onclick = null;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) { this.children.push(child); }
}

const elements = new Map();
function getOrCreateElement(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(id, tag));
  }
  return elements.get(id);
}

global.window = global;
global.document = {
  body: new MockElement('body', 'body'),
  getElementById: (id) => getOrCreateElement(id),
  createElement: (tag) => new MockElement('', tag),
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};

eval(fs.readFileSync('game_modular/js/data_loader.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/state.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/engine.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/events.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/actions.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/adopters.js', 'utf8'));
eval(fs.readFileSync('game_modular/js/ui.js', 'utf8'));

const idsToMock = [
  'dayCounter', 'calendarDateBadge', 'acutePhaseBadge', 'seasonBadge', 'seasonEffects',
  'headerPetName', 'headerCoatBadge', 'headerAlbumCount', 'petStatusSummary',
  'statBudget', 'statMental', 'statEnergy', 'energyReserveBadge', 'statAnimalHealth',
  'mentalBar', 'energyBar', 'healthBar', 'healthStatusText', 'energy-tooltip', 'energyDrainBreakdown',
  'newbornUrgentBanner', 'btnCowMilkTrap', 'btnBuyFormula', 'btnFeedNewborns', 'milkSupplyTag',
  'btnTogglePaidFoster', 'milkSupplyBox', 'milkSupplyLabel', 'btnSidebarBuyFormula',
  'applicationStatusBadge', 'cardLimitBar', 'cardCollectedCount', 'btnClinicPartner', 'btnClinicMajor',
  'giftedFoodBadge', 'giftThankYouBanner', 'fosterStatusBadge', 'playerTagsContainer', 'petSvgContainer',
  'animalSpeciesBadge', 'animalTitle', 'coatPopularityBadge', 'animalDescription', 'visibleStateText',
  'qBadge', 'parasitesBadge', 'sterilBadge', 'woodBadge', 'ringwormBadge', 'socialBadge',
  'vaccineBadge', 'actionsTabContainer', 'tabBtn_vet', 'tabBtn_zooshans', 'tabBtn_care',
  'tabContent_vet', 'tabContent_zooshans', 'tabContent_care', 'grid_vet', 'grid_zooshans', 'grid_care',
  'btnAdvanceAcuteDay', 'speedButtonsGroup', 'btnSpeed0', 'btnSpeed1', 'btnSpeed2', 'btnSpeed5',
  'btnFastForward', 'tickIndicator', 'deadlinesRadarList', 'deadlinesList', 'gameLog', 'endGameModal', 'endModalBadge',
  'endModalTitle', 'endModalDescription', 'endModalMistakesCard', 'endModalMistakesText',
  'statDays', 'statPersonalSpent', 'statVoucherUsed', 'statFilteredCalls',
  'storyCardTitle', 'storyCardSubtitle', 'storyCardStatDays', 'storyCardStatPersonal',
  'storyCardStatVoucher', 'storyCardStatFiltered', 'storyCardStatAlbum',
  'endGameOverviewBanner', 'endBannerTitle', 'endBannerSubtitle', 'animalModal', 'savedAlbumModal',
  'eventOverlayBox', 'candidateInterviewModal', 'candidateActionButtons',
  'slot2ClosedView', 'slot2OpenView', 'candidateSlot2Box',
  'slot3ClosedView', 'slot3OpenView', 'candidateSlot3Box',
  'escapeUrgentBanner', 'escapeDaysLeftTag', 'escapeProgressTag', 'checklistHintText', 'animalChecklistTags'
];
idsToMock.forEach(id => getOrCreateElement(id));

// 1. Force start with severe_trauma_sheri_dog
const sheriScenario = window.GAME_DATA.scenarios.find(s => s.id === 'severe_trauma_sheri_dog');
if (!sheriScenario) throw new Error('severe_trauma_sheri_dog not found in scenarios');

startNewRun(false, sheriScenario);
renderAll();

console.log('--- Test: Sheri Dog Trauma Run Started ---');
console.log('Archetype:', state.animal.id);
console.log('Species:', state.animal.species);
console.log('Has severe trauma:', state.animal.hiddenState.hasSevereTrauma);

// 2. Check Day 1 UI hints & Radar Deadlines
const hint = getOrCreateElement('checklistHintText').textContent;
console.log('Checklist hint on Day 1:', hint);
if (!hint.includes('экстренную операцию') && !hint.includes('операцию в реанимационном стационаре')) {
  throw new Error('Checklist must prioritize emergency surgery/стационар over deworming!');
}

// Check deadlinesList for ticks
renderDeadlines();
const deadlinesHtml = getOrCreateElement('deadlinesRadarList').innerHTML;
console.log('Deadlines HTML:', deadlinesHtml);
console.log('Deadlines contains screaming tick warning?:', deadlinesHtml.includes('Защита от клещей истекла!'));
if (deadlinesHtml.includes('Защита от клещей истекла!')) {
  throw new Error('Trauma dog before/in стационар must NOT have screaming tick deadline warning!');
}
if (!deadlinesHtml.includes('После стац.') && !deadlinesHtml.includes('На покое')) {
  throw new Error('Deadlines must show peaceful status: После стац. / На покое');
}

// 3. Conduct surgery
console.log('\n--- Conducting Surgery and Hospitalization ---');
// Submit application first for voucher
state.zooshans.applicationSubmitted = true;
state.zooshans.expensiveApproved = true;
state.zooshans.clinicMode = 'major_voucher';
renderAll();

// Trigger surgery
const vetButtons = [];
// Find surgery button in Tab 1
const gridVet = getOrCreateElement('grid_vet');
// Render Tab 1 to populate buttons
renderActionTabs();
// Let's trigger surgery directly like the card does:
payVetBill(450, true, 'Экстренная хирургия (остеосинтез/челюсть) и реанимационный стационар', true);
state.animal.traumaOperated = true;
state.animal.hiddenState.hasSevereTrauma = false;
state.animal.health = 92;
state.animal.inStationaryDaysLeft = 3;
renderAll();

console.log('Surgery performed. traumaOperated:', state.animal.traumaOperated);
console.log('inStationaryDaysLeft:', state.animal.inStationaryDaysLeft);

// Check checklist hint after surgery
const hintPostOp = getOrCreateElement('checklistHintText').textContent;
console.log('Checklist hint after surgery:', hintPostOp);
if (!hintPostOp.includes('после стационара') && !hintPostOp.includes('позже')) {
  throw new Error('Checklist must state that processing can be done after стационара!');
}

// 4. Advance through Day 2, Day 3, Day 4
console.log('\n--- Advancing to Day 4 to test Escape Prevention ---');
getOrCreateElement('eventOverlayBox').classList.add('hidden');
advanceAcuteDay(); // Day 2
console.log('Day now:', state.day, 'inStationaryDaysLeft:', state.animal.inStationaryDaysLeft);

advanceAcuteDay(); // Day 3
console.log('Day now:', state.day, 'inStationaryDaysLeft:', state.animal.inStationaryDaysLeft);

advanceAcuteDay(); // Day 4 - CRITICAL DAY FOR DOG ESCAPE!
console.log('Day now:', state.day, 'inStationaryDaysLeft:', state.animal.inStationaryDaysLeft);

// Verify dog escape DID NOT TRIGGER
console.log('escapeQuest active?:', state.escapeQuest.active);
if (state.escapeQuest.active) {
  throw new Error('DOG AFTER SURGERY / TRAUMA MUST NOT ESCAPE ON DAY 4!');
}

// Check log for dog escape prevention notice
const loggedEscapeNotice = state.logs.some(l => l.text.includes('Собака восстанавливается после операции (стационар/покой)'));
console.log('Found log explaining dog cannot escape after surgery?:', loggedEscapeNotice);
if (!loggedEscapeNotice) {
  throw new Error('Expected informative log explaining why dog does not escape after surgery!');
}

// Verify piroplasmosis DID NOT TRIGGER
console.log('Piroplasmosis triggered?:', !!state.triggeredEvents.piroplasmosisOutbreak);
if (state.triggeredEvents.piroplasmosisOutbreak) {
  throw new Error('Piroplasmosis must not trigger for dog in hospital / recovering from surgery!');
}

// 5. Advance to Day 5 - Discharge from stationary
advanceAcuteDay(); // Day 5
console.log('Day now:', state.day, 'inStationaryDaysLeft:', state.animal.inStationaryDaysLeft);

const loggedDischarge = state.logs.some(l => l.text.includes('выписан(а) из послеоперационного стационара'));
console.log('Discharge logged?:', loggedDischarge);
if (!loggedDischarge) {
  throw new Error('Expected discharge log after inStationaryDaysLeft reached 0!');
}

console.log('\n✅ ALL CHECKS PASSED: Dog after surgery cannot escape, and parasite processing is safely deferred until after стационара!');
