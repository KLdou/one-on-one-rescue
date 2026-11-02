const fs = require('fs');
const vm = require('vm');
const files = [
  'game_modular/js/data_loader.js',
  'game_modular/js/state.js',
  'game_modular/js/actions.js',
  'game_modular/js/engine.js',
  'game_modular/js/adopters.js',
  'game_modular/js/events.js'
];
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { getElementById: () => ({ classList: { add: () => {}, remove: () => {} } }) };
global.renderAll = () => {};
global.renderLog = () => {};
global.stopTimer = () => {};
global.startTimer = () => {};
global.closeEventModal = () => {};
global.showEventModal = () => {};
global.addLog = () => {};
for (const f of files) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'));
}
window.state = {
  animal: {
    id: 'test_adopt',
    name: 'Рыжик',
    petName: 'Рыжик',
    species: 'cat',
    speciesLabel: 'Кот',
    gender: 'male',
    coatName: 'Ярко-рыжий',
    coatTier: 'hit',
    activeCount: 1,
    ageCategory: 'adult'
  },
  trialAnimals: [],
  zooshans: { locationStatus: 'home' },
  calendarDate: new Date()
};
const trialCall = {
  id: 'call_compromise_normal_family',
  candidateName: 'Семья Ивановых',
  housing: '2к кв'
};
initiateAnimalTransferWithTrial(trialCall, 'hold_free');
console.log('trialAnimals count:', window.state.trialAnimals.length);
console.log('trialAnimals:', JSON.stringify(window.state.trialAnimals, null, 2));
