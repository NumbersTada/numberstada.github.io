function AutoManager(game) {
  this.game = game;
  this.lastMoveTime = 0;
  this.moves = 0;
  this.totalTime = 0;
  this.avgTime = 0;
  this.movesPerFrame = 0;

  this.mpsTracker = new EventRateTracker;

  this.maxSteps = 3;
  this.perfDisplayMPS = document.getElementById("perf-display-mps");
  this.perfDisplayMPF = document.getElementById("perf-display-mpf");
  this.perfDisplayLast = document.getElementById("perf-display-last");
  this.perfDisplayAvg = document.getElementById("perf-display-avg");
  this.perfDisplayTotalTime = document.getElementById("perf-display-total-time");
  this.perfDisplayMoves = document.getElementById("perf-display-moves");

  this.perfDisplayLoop();
}


AutoManager.prototype.move = function () {
  var elapsed = 0;
  var startTime = performance.now() / 1000;
  var moves = 0;
  var moveTime, results, now;
  while (elapsed < 1/1000) {
  //while (moves < 1000) {
    results = this.game.move.bind(this.game)(this.game.selectedBot.obj.getBestMove(game));
    if (results && results.moved) {
      ++moves;
      ++this.moves;
      this.mpsTracker.recordEvent();
    }
    elapsed = performance.now() / 1000 - startTime;
  }
  var moveTime = elapsed / moves;
  this.movesPerFrame = moves;
  this.updateStats(moveTime,elapsed);
}

AutoManager.prototype.oneMove = function () {
  var startTime = performance.now() / 1000;
  this.game.move.bind(this.game)(this.game.selectedBot.obj.getBestMove(game));
  ++this.moves;
  moveTime = performance.now() / 1000 - startTime;
  this.updateStats(moveTime,moveTime);
}

AutoManager.prototype.formatTime = function (time, decimals) {
  const t = new Date(time);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const s = t.getUTCSeconds();
  const s2 = time % 1000 / 1000;
  return (h ? h+":" : "")+(h || m ? (""+m).padStart(h ? 2 : 0,"0")+":" : "")+(parseInt(s)+"").padStart(h || m ? 2 : 0,"0")+"."+s2.toFixed(decimals).substring(2);
}

AutoManager.prototype.updateStats = function (moveTime,elapsed) {
  this.lastMoveTime = moveTime;
  this.totalTime += elapsed;
  this.avgTime = this.totalTime / this.moves;
}

AutoManager.prototype.resetStats = function () {
  this.lastMoveTime = 0;
  this.moves = 0;
  this.totalTime = 0;
  this.avgTime = 0;
  this.game.storageManager.setBestScore(0);
  this.game.prepareTiles();
  this.game.actuate();
}

AutoManager.prototype.perfDisplayLoop = function () {
  this.mpsTracker.removeOld();

  this.perfDisplayMPS.innerText = this.mpsTracker.getRate();
  this.perfDisplayMPF.innerText = this.movesPerFrame;
  this.perfDisplayLast.innerText = this.lastMoveTime.toFixed(4);
  this.perfDisplayAvg.innerText = this.avgTime.toFixed(4);
  this.perfDisplayTotalTime.innerText = this.formatTime(this.totalTime * 1000, 4);
  this.perfDisplayMoves.innerText = "" + this.moves;
  
  window.requestAnimationFrame(this.perfDisplayLoop.bind(this));
}