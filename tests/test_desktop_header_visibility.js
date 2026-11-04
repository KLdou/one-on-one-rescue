const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Test: Desktop Header & HUD Visibility & Responsive Classes ---');

const htmlPath = path.join(__dirname, '../game_modular/index.html');
const cssPath = path.join(__dirname, '../game_modular/css/styles.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// 1. Verify index.html desktop header has class 'desktop-header' and does NOT have 'hidden' or 'mobile-header'
// Locate header element containing desktop top-bar elements (e.g. tickIndicator, dayCounter)
const headerMatch = htmlContent.match(/<header\s+class="([^"]*)"[^>]*>[\s\S]*?<span id="tickIndicator"/);
assert(headerMatch, 'index.html MUST contain a desktop <header> element with id="tickIndicator" inside');

const headerClasses = headerMatch[1].split(/\s+/);
assert(
  headerClasses.includes('desktop-header'),
  'Desktop <header> MUST include class "desktop-header"'
);
assert(
  !headerClasses.includes('hidden'),
  'Desktop <header> MUST NOT include class "hidden" (which collides with .hidden !important)'
);
assert(
  !headerClasses.includes('mobile-header'),
  'Desktop <header> MUST NOT include class "mobile-header"'
);

// 2. Verify index.html desktop HUD section has class 'desktop-hud' and does NOT have 'hidden'
// Locate HUD section containing widget-cash
const hudMatch = htmlContent.match(/<section\s+class="([^"]*)"[^>]*>[\s\S]*?id="widget-cash"/);
assert(hudMatch, 'index.html MUST contain desktop HUD <section> containing widget-cash');

const hudClasses = hudMatch[1].split(/\s+/);
assert(
  hudClasses.includes('desktop-hud'),
  'Desktop HUD <section> MUST include class "desktop-hud"'
);
assert(
  !hudClasses.includes('hidden'),
  'Desktop HUD <section> MUST NOT include class "hidden"'
);

// 3. Verify container wrapping showAlbumModal() has class 'desktop-service-buttons' and does NOT have 'hidden'
const albumContainerMatch = htmlContent.match(/<div\s+class="([^"]*)"[^>]*>\s*<button[^>]*onclick="showAlbumModal\(\)"/);
assert(albumContainerMatch, 'index.html MUST contain a container wrapping showAlbumModal()');

const albumContainerClasses = albumContainerMatch[1].split(/\s+/);
assert(
  albumContainerClasses.includes('desktop-service-buttons'),
  'Container wrapping showAlbumModal() MUST include class "desktop-service-buttons"'
);
assert(
  !albumContainerClasses.includes('hidden'),
  'Container wrapping showAlbumModal() MUST NOT include class "hidden"'
);

// 4. Verify styles.css specifies @media (max-width: 1023px) rules hiding .desktop-header, .desktop-hud, and .desktop-service-buttons
assert(
  cssContent.includes('@media (max-width: 1023px)'),
  'styles.css MUST contain "@media (max-width: 1023px)"'
);

const maxIndex = cssContent.indexOf('@media (max-width: 1023px)');
const minIndex = cssContent.indexOf('@media (min-width: 1024px)');

// Ensure both media blocks exist
assert(maxIndex !== -1, 'styles.css MUST have @media (max-width: 1023px)');
assert(minIndex !== -1, 'styles.css MUST have @media (min-width: 1024px)');

// Check that under max-width 1023px, desktop-header, desktop-hud, and desktop-service-buttons are hidden with display: none !important
const mobileBlock = cssContent.substring(maxIndex, minIndex > maxIndex ? minIndex : cssContent.length);
assert(
  mobileBlock.includes('.desktop-header') &&
  mobileBlock.includes('.desktop-hud') &&
  mobileBlock.includes('.desktop-service-buttons') &&
  mobileBlock.includes('display: none !important'),
  'styles.css MUST hide .desktop-header, .desktop-hud, and .desktop-service-buttons in @media (max-width: 1023px) with display: none !important'
);

// 5. Verify styles.css specifies @media (min-width: 1024px) rules restoring display for .desktop-header, .desktop-hud, and .desktop-service-buttons
const desktopBlock = cssContent.substring(minIndex);
assert(
  desktopBlock.includes('.desktop-header') &&
  desktopBlock.includes('display: flex !important'),
  'styles.css MUST set .desktop-header { display: flex !important; } in @media (min-width: 1024px)'
);

assert(
  desktopBlock.includes('.desktop-hud') &&
  desktopBlock.includes('display: grid !important'),
  'styles.css MUST set .desktop-hud { display: grid !important; } in @media (min-width: 1024px)'
);

assert(
  desktopBlock.includes('.desktop-service-buttons') &&
  desktopBlock.includes('display: flex !important'),
  'styles.css MUST set .desktop-service-buttons { display: flex !important; } in @media (min-width: 1024px)'
);

console.log('✅ Desktop Header & HUD Visibility test passed.');
