// scratch/check_sync.js
const fs = require('fs');

const dl = fs.readFileSync('game_modular/js/data_loader.js', 'utf8');

const fileMap = {
  config: 'config',
  player_axes: 'playerAxes',
  coats: 'coats',
  scenarios: 'scenarios',
  petnames: 'petnames',
  calls: 'calls',
  mentor_hints: 'mentorHints'
};

const fileNames = Object.keys(fileMap);
fileNames.forEach(name => {
  const jsonContent = JSON.parse(fs.readFileSync(`game_modular/data/${name}.json`, 'utf8'));
  console.log(`Checking ${name}.json...`);
});

// Evaluate data_loader.js
global.window = {};
eval(dl);
const fallback = global.window.GAME_DATA;

let allMatch = true;
fileNames.forEach(name => {
  const jsonContent = JSON.parse(fs.readFileSync(`game_modular/data/${name}.json`, 'utf8'));
  const key = fileMap[name];
  const fallbackContent = fallback[key] || fallback[name];
  const jsonStr = JSON.stringify(jsonContent);
  const fallbackStr = JSON.stringify(fallbackContent);
  if (jsonStr === fallbackStr) {
    console.log(`  ${name}: 100% MATCH`);
  } else {
    allMatch = false;
    console.log(`  ${name}: MISMATCH! jsonLen=${jsonStr.length}, fallbackLen=${fallbackStr ? fallbackStr.length : 0}`);
  }
});

if (!allMatch) {
  process.exit(1);
}
