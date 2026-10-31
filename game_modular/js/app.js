// app.js - Главный входной файл и запуск игры
async function initGame() {
  await loadGameDataAsync();
  switchTab('vet');
  startNewRun();
}

window.onload = function() {
  initGame();
};
