const fs = require('fs');

// Mock browser globals
global.window = {};
global.document = {
  body: {
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} }
  },
  getElementById: (id) => {
    return {
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
    };
  },
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

// Load code files
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

console.log('--- 1. Testing Day 1 Intro Choices ---');
console.log('Saved album length:', getSavedAlbum().length);
// As novice:
triggerDay1IntroModal();
console.log('Novice intro triggered successfully.');

// Fake an album entry:
global.localStorage.getItem = () => JSON.stringify([{
  id: 123,
  petName: 'Барсик Рокоссовский',
  species: 'cat',
  daysSpent: 20
}]);
console.log('Saved album length after mock:', getSavedAlbum().length);
triggerDay1IntroModal();
console.log('Experienced curator intro triggered successfully.');

console.log('--- 2. Testing Incoming Call Modal (Section 7) ---');
const calls = getDynamicAdopterCalls(state.animal);
console.log('Generated call pool count:', calls.length);
const testCall = calls[0];
ensureCandidateCallSlots(testCall, state.animal);
console.log('Candidate Name:', testCall.candidateName);
console.log('Housing:', testCall.housing);
console.log('Source:', testCall.source);
console.log('Slot 1:', testCall.slot1);
console.log('Slot 2:', testCall.slot2);
console.log('Slot 3:', testCall.slot3);

triggerIncomingCallModal(testCall);
console.log('Candidate modal opened.');

console.log('--- 3. Testing Inspection of Slots (-2 energy) ---');
state.energy = 50;
actionInspectCandidateSlot(2);
actionInspectCandidateSlot(3);
console.log('Energy after 2 inspections:', state.energy);

console.log('--- 4. Testing Refusal with Red Flag (+3% Mental) ---');
state.mental = 80;
actionRefuseCandidate();
console.log('Mental after refusal:', state.mental);

console.log('--- 5. Testing Transfer to Trial (14 days) and Album ---');
const normalCall = calls.find(c => c.isSafe && !c.isTrialReturn) || calls[0];
initiateAnimalTransferWithTrial(false, normalCall);
console.log('Trial animals count:', state.trialAnimals.length);
const trialItem = state.trialAnimals[0];
console.log('Trial target days:', trialItem.targetDays, 'trialDaysTotal:', trialItem.trialDaysTotal);
console.log('Reliability flag:', trialItem.reliabilityFlag);

showAlbumModal();
console.log('Album modal rendered.');

console.log('--- 6. Testing Trial Return ("Забрать обратно") ---');
actionCancelTrialReturn(trialItem.id);
console.log('Trial animals after cancel:', state.trialAnimals.length);
console.log('Active count restored:', state.animal.activeCount);

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
