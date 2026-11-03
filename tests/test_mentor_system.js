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
const context = { window: {}, console: console };
vm.createContext(context);
const dataLoaderCode = fs.readFileSync(path.resolve(__dirname, '../game_modular/js/data_loader.js'), 'utf8');
vm.runInContext(dataLoaderCode, context);
assert(context.window.GAME_DATA, 'window.GAME_DATA must exist');
assert(context.window.GAME_DATA.mentorHints, 'mentorHints missing from window.GAME_DATA fallback');
requiredKeys.forEach(k => {
  assert(context.window.GAME_DATA.mentorHints[k], `Missing fallback mentorHint in data_loader.js: ${k}`);
});
console.log('✓ Task 1: data_loader.js fallback window.GAME_DATA.mentorHints valid');
