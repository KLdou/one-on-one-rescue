const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({
  console, Math, Date, window: {},
  document: {
    body: { setAttribute(){} },
    getElementById: () => ({ classList: { add(){}, remove(){} }, style: {}, dataset: {} }),
    querySelectorAll: () => [],
    querySelector: () => ({ classList: { add(){} } }),
    createElement: () => ({ classList: { add(){} } }),
    addEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {} }
});
context.window = context;
['game_modular/js/data_loader.js', 'game_modular/js/state.js', 'game_modular/js/engine.js', 'game_modular/js/events.js', 'game_modular/js/actions.js', 'game_modular/js/adopters.js', 'game_modular/js/ui.js'].forEach(f => vm.runInContext(fs.readFileSync(f, 'utf8'), context));
try {
  vm.runInContext(`
    startNewRun();
    state.animal.species = 'dog';
    state.animal.ageCategory = 'puppy';
    state.animal.litterTrained = false;
    state.animal.litterTrainDaysDone = 7;
    state.logs = [];
    processDayTick();
    console.log("LOGS COUNT:", state.logs.length);
    console.log("LOGS:", state.logs.map(l => l.text));
  `, context);
} catch(e) {
  console.error("ERROR:", e);
}
