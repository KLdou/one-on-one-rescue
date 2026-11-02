// scratch/check_sync.js
const fs = require('fs');

const dl = fs.readFileSync('game_modular/js/data_loader.js', 'utf8');

const files = ['config', 'player_axes', 'coats', 'scenarios', 'petnames', 'calls'];
files.forEach(name => {
  const jsonContent = JSON.parse(fs.readFileSync(`game_modular/data/${name}.json`, 'utf8'));
  console.log(`Checking ${name}.json...`);
  // Check if dl contains window.GAME_DATA
});

// Evaluate data_loader.js
global.window = {};
eval(dl);
const fallback = global.window.GAME_DATA;

files.forEach(name => {
  const jsonContent = JSON.parse(fs.readFileSync(`game_modular/data/${name}.json`, 'utf8'));
  const fallbackContent = fallback[name] || fallback.playerAxes;
  const jsonStr = JSON.stringify(jsonContent);
  const fallbackStr = JSON.stringify(fallbackContent);
  if (jsonStr === fallbackStr) {
    console.log(`  ${name}: 100% MATCH`);
  } else {
    console.log(`  ${name}: MISMATCH! jsonLen=${jsonStr.length}, fallbackLen=${fallbackStr ? fallbackStr.length : 0}`);
  }
});
