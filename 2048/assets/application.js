window.requestAnimationFrame(function(){runApplication()})
function runApplication() {
  new GameManager(4, 4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  var storage = new LocalStorageManager();
}