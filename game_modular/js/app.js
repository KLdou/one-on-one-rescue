// app.js - Главный входной файл и запуск игры
async function initGame() {
  await loadGameDataAsync();
  startNewRun();
  switchTab('vet');
  if (typeof setupResourceTooltipsEvents === 'function') {
    setupResourceTooltipsEvents();
  }
}

window.onload = function() {
  initGame();
};
