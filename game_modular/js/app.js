// app.js - Главный входной файл и запуск игры
async function initGame() {
  await loadGameDataAsync();
  startNewRun();
  switchTab('vet');
}

window.onload = function() {
  initGame();
};
