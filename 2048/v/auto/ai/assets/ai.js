function AI(game) {
  this.game = game;
  this.lastMoveTime = 0;
  this.moves = 0;
  this.totalTime = 0;
  this.avgTime = 0;

  this.mpsTracker = new EventRateTracker;

  this.maxSteps = 3;
  this.perfDisplayMPS = document.getElementById("perf-display-mps");
  this.perfDisplayLast = document.getElementById("perf-display-last");
  this.perfDisplayAvg = document.getElementById("perf-display-avg");
  this.perfDisplayTotalTime = document.getElementById("perf-display-total-time");
  this.perfDisplayMoves = document.getElementById("perf-display-moves");

  this.perfDisplayLoop();
}

AI.prototype.countCells = function (grid) {
  var count = 0;
  for (var x = 0; x < this.game.grid.size; x++) {
    for (var y = 0; y < this.game.grid.size; y++) {
      if (grid[x][y]) count++;
    }
  }
  return count;
}

AI.prototype.countEmpty = function (grid) {
  var count = 0;
  for (var x = 0; x < this.game.grid.size; x++) {
    for (var y = 0; y < this.game.grid.size; y++) {
      if (!grid[x][y]) count++;
    }
  }
  return count;
}


AI.prototype.estimate = function (grid) {
  var sum = 0;
  var penalty = 0;
  for (var x = 0; x < this.game.grid.size; x++) {
    for (var y = 0; y < this.game.grid.size; y++) {
      var val = grid[x][y] ? grid[x][y].value : 0;
      sum += val;
      if (x < 3) penalty += Math.abs(val - (grid[x+1][y] ? grid[x+1][y].value : 0));
      if (y < 3) penalty += Math.abs(val - (grid[x][y+1] ? grid[x][y+1].value : 0));
    }
  }
  return (sum * 4 - penalty) * 2;
}

AI.prototype.integratedScoreAlgorithm = function () {
  if (this.game.isGameTerminated()) return; // Don't do anything if the game's over
  var maxScore = -1/0;
  var bestDir = 0;
  var deadMoves = [];
  var possibleMoves = [];
  for (var dir = 0; dir < 4; dir++) {
    var prevScore = this.game.score;
    var results = this.game.move(dir, true);
    if (!results.moved) continue;
    possibleMoves.push(dir);
    if (results.over) {
      deadMoves.push(dir);
      continue;
    };
    var pgCells = this.countCells(results.previousGrid);
    var agCells = this.countCells(results.afterGrid);
    var moveScore = results.moveScore - (results.over * 10000) + (Math.max(0, agCells - pgCells) * 10);
    if (moveScore > maxScore) {
      maxScore = moveScore;
      bestDir = dir;
    }
  }
  if (possibleMoves.length == deadMoves.length) {
    bestDir = deadMoves[Math.floor(Math.random() * deadMoves.length)];
  }
  console.log("Integrated score search ended, best move: " + bestDir);
  return bestDir
}

AI.prototype.heuristicAlgorithm = function () {
  if (this.game.isGameTerminated()) return; // Don't do anything if the game's over
  var maxScore = -1/0;
  var bestDir = 0;
  var deadMoves = [];
  var possibleMoves = [];
  for (var dir = 0; dir < 4; dir++) {
    var results = this.game.move(dir, true);
    if (!results.moved) continue;
    possibleMoves.push(dir);
    if (results.over) {
      deadMoves.push(dir);
      continue;
    };
    var moveScore = this.estimate(results.afterGrid);
    if (moveScore > maxScore) {
      maxScore = moveScore;
      bestDir = dir;
    }
  }
  if (possibleMoves.length == deadMoves.length) {
    bestDir = deadMoves[Math.floor(Math.random() * deadMoves.length)];
  }
  console.log("Heuristic search ended, best move: " + bestDir);
  return bestDir
}

AI.prototype.search = function (grid, step) {
  if (step == this.maxSteps) return this.estimate(grid);
  //var bestMove = Math.floor(Math.random() * 4);
  var scores = {};
  for (var dir = 0; dir < 4; dir++) {
    var before = this.game.grid.serialize().cells;
    this.game.grid.cells = this.game.grid.fromState(grid);
    var r = this.game.move(dir, true);
    this.game.grid.cells = this.game.grid.fromState(before);
    if (!r.moved) continue;
    var score = r.moveScore;
    var empty = this.countEmpty(r.afterGrid);
    if (r.over) {
      score -= 10**20;
    } else {
      for (var x = 0; x < this.game.grid.size; x++) {
        for (var y = 0; y < this.game.grid.size; y++) {
          if (!r.afterGrid[x][y]) {
            r.afterGrid[x][y] = new Tile({x:x,y:y},2);
            score += 1 / empty * 0.9 * this.search(r.afterGrid, step+1);
            r.afterGrid[x][y] = new Tile({x:x,y:y},4);
            score += 1 / empty * 0.1 * this.search(r.afterGrid, step+1);
          }
        }
      }
    }
  scores[dir] = score;
  }
  var max = -1/0;
  var bestMove = Math.floor(Math.random() * 4);
  for (var i = 0; i < 4; i++) {
    if (scores[i] > max) {
      max = scores[i];
      bestMove = i;
    }
  }
  return step == 0 ? bestMove : max;
}

AI.prototype.searchAlgorithm = function () {
  var startTime = performance.now()/1000;
  if (this.game.isGameTerminated()) return; // Don't do anything if the game's over
  var empty = this.countEmpty(this.game.grid.cells);
  this.maxSteps = empty < 4 ? 3 : 2;
  var bestDir = this.search(this.game.grid.serialize().cells, 0);
  var moveTime = performance.now()/1000 - startTime;
  this.updateStats(moveTime);
  return bestDir;
}


AI.prototype.getBestMove = function () {
  return this.searchAlgorithm();
}

AI.prototype.formatTime = function (time) {
  const t = new Date(time);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const s = t.getUTCSeconds();
  const ms = t.getUTCMilliseconds();
  return (h ? h+":" : "")+(h || m ? (""+m).padStart(h ? 2 : 0,"0")+":" : "")+(""+s).padStart(h || m ? 2 : 0,"0")+"."+(""+ms).padStart(3,"0");
}

AI.prototype.updateStats = function (moveTime) {
  this.lastMoveTime = moveTime;
  this.moves++;
  this.totalTime += moveTime;
  this.avgTime = this.totalTime/this.moves;
  this.mpsTracker.recordEvent();
}

AI.prototype.resetStats = function () {
  this.lastMoveTime = 0;
  this.moves = 0;
  this.totalTime = 0;
  this.avgTime = 0;
}

AI.prototype.perfDisplayLoop = function () {
  this.mpsTracker.removeOld();

  this.perfDisplayMPS.innerText = this.mpsTracker.getRate();
  this.perfDisplayLast.innerText = this.lastMoveTime.toFixed(3);
  this.perfDisplayAvg.innerText = this.avgTime.toFixed(3);
  this.perfDisplayTotalTime.innerText = this.formatTime(this.totalTime * 1000);
  this.perfDisplayMoves.innerText = "" + this.moves;
  setTimeout(this.perfDisplayLoop.bind(this),0);
}
