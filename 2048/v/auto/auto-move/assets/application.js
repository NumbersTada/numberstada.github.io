window.requestAnimationFrame(function(){runApplication()})
function runApplication() {
  window.game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager, AutoManager);
  var storage = new LocalStorageManager();
}