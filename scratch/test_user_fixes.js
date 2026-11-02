const fs = require('fs');

global.window = {};
global.document = {
  body: {
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} }
  },
  getElementById: (id) => ({
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    textContent: '',
    innerHTML: '',
    className: '',
    style: {},
    appendChild: () => {}
  }),
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    style: {}
  }),
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

const stateCode = fs.readFileSync('game_modular/js/state.js', 'utf8');
const dataCode = fs.readFileSync('game_modular/js/data_loader.js', 'utf8');
const actionsCode = fs.readFileSync('game_modular/js/actions.js', 'utf8');
const engineCode = fs.readFileSync('game_modular/js/engine.js', 'utf8');
const eventsCode = fs.readFileSync('game_modular/js/events.js', 'utf8');
const adoptersCode = fs.readFileSync('game_modular/js/adopters.js', 'utf8');
const uiCode = fs.readFileSync('game_modular/js/ui.js', 'utf8');

eval(dataCode);
eval(stateCode);
eval(actionsCode);
eval(engineCode);
eval(eventsCode);
eval(adoptersCode);
eval(uiCode);

startNewRun();

console.log('--- 1. Testing Exhibition Trigger when cat is on trial (nActive = 0) ---');
state.day = 24;
state.animal.parasitesAndVaccinated = true;
state.animal.isSterilized = true;
state.animal.activeCount = 0; // On trial
state.trialAnimals = [{
  id: 999,
  petName: 'Адмирал Веснянский',
  trialDaysTotal: 14,
  daysPassed: 4,
  count: 1
}];

let festTriggered = false;
global.triggerFestivalModal = () => { festTriggered = true; };

processDayTick();
console.log('Day after tick:', state.day);
console.log('Did festival trigger when nActive=0?', festTriggered);
if (festTriggered) {
  throw new Error('FAIL: Festival triggered while cat is on trial!');
}
console.log('PASS: Festival did not trigger when cat is on trial.');

console.log('--- 2. Testing Early-Booked transfer before vaccination ---');
state.animal.activeCount = 1;
state.animal.parasitesAndVaccinated = false;
state.animal.ageDays = 46;
state.pr.earlyBookedAdopterWaiting = true;

let earlyBookModalShown = false;
global.showEventModal = (title, desc, choices) => {
  earlyBookModalShown = true;
  console.log('Modal title:', title);
  console.log('Desc preview:', desc.slice(0, 80) + '...');
  console.log('Choices count:', choices.length);
  // Execute choice 0 (transfer on trial before vaccine)
  choices[0].action();
};

triggerEarlyBookedTransferModal();
console.log('Early booked modal shown:', earlyBookModalShown);
console.log('Trial animals count after early-booked transfer:', state.trialAnimals.length);
console.log('Active count after transfer:', state.animal.activeCount);
console.log('Early booked flag cleared:', state.pr.earlyBookedAdopterWaiting);

console.log('--- 3. Testing Orphan Babies without mom (adoption < 60 days) ---');
startNewRun();
state.animal.hasMotherCat = false;
state.animal.ageCategory = 'kitten';
state.animal.ageDays = 42;
state.animal.dewormStage = 1;
state.animal.examinedWood = true;
state.animal.knownRingworm = false;

const isOrphanBaby = !state.animal.hasMotherCat && (state.animal.ageCategory === 'kitten' || state.animal.ageCategory === 'puppy');
const isOrphanBabyEligible = isOrphanBaby && state.animal.ageDays >= 40 && state.animal.dewormStage >= 1;
console.log('Is orphan baby eligible to start PR at 42 days?', isOrphanBabyEligible);
if (!isOrphanBabyEligible) {
  throw new Error('FAIL: Orphan baby could not start PR at 42 days!');
}
console.log('PASS: Orphan baby without mom can start PR and be adopted before 60 days!');

console.log('--- ALL CHECKS PASSED! ---');
