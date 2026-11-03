const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('game_modular/data/config.json', 'utf8'));
const playerAxes = JSON.parse(fs.readFileSync('game_modular/data/player_axes.json', 'utf8'));
const coats = JSON.parse(fs.readFileSync('game_modular/data/coats.json', 'utf8'));
const scenarios = JSON.parse(fs.readFileSync('game_modular/data/scenarios.json', 'utf8'));
const calls = JSON.parse(fs.readFileSync('game_modular/data/calls.json', 'utf8'));
const petnames = JSON.parse(fs.readFileSync('game_modular/data/petnames.json', 'utf8'));
const mentorHints = JSON.parse(fs.readFileSync('game_modular/data/mentor_hints.json', 'utf8'));

const fullData = {
  config,
  playerAxes,
  coats,
  scenarios,
  calls,
  petnames,
  mentorHints
};

const dlPath = 'game_modular/js/data_loader.js';
const content = fs.readFileSync(dlPath, 'utf8');
const lines = content.split('\n');

lines[1] = 'window.GAME_DATA = ' + JSON.stringify(fullData) + ';';

fs.writeFileSync(dlPath, lines.join('\n'), 'utf8');
console.log('Successfully synchronized window.GAME_DATA with all 7 data/*.json files!');

// Verification
const checkObj = JSON.parse(lines[1].replace('window.GAME_DATA = ', '').replace(/;$/, ''));
console.log('calls.adopterCalls count:', checkObj.calls.adopterCalls.length);
console.log('mentorHints keys count:', Object.keys(checkObj.mentorHints || {}).length);
console.log('FeLV call present:', !!checkObj.calls.adopterCalls.find(c => c.id === 'call_felv_aware_single_pet'));
console.log('New Year call present:', !!checkObj.calls.adopterCalls.find(c => c.id === 'call_gift_new_year_rush'));
const trojan = checkObj.scenarios.find(s => s.id === 'ginger_kitten_trojan_horse');
console.log('Trojan horse incubation:', trojan.hiddenState.virusIncubationDays, trojan.hiddenState.ringwormIncubationDays);
