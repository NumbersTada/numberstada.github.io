[
{name: "Search Algorithm", author: "NumbersTada", obj: {
countCells: function (grid) {
  var count = 0;
  for (var x = 0; x < window.game.grid.size; x++) {
    for (var y = 0; y < window.game.grid.size; y++) {
      if (grid[x][y]) count++;
    }
  }
  return count;
},

countEmpty: function (grid) {
  var count = 0;
  for (var x = 0; x < window.game.grid.size; x++) {
    for (var y = 0; y < window.game.grid.size; y++) {
      if (!grid[x][y]) count++;
    }
  }
  return count;
},

estimate: function (grid) {
  var sum = 0;
  var penalty = 0;
  for (var x = 0; x < window.game.grid.size; x++) {
    for (var y = 0; y < window.game.grid.size; y++) {
      var val = grid[x][y] ? grid[x][y].value : 0;
      sum += val;
      if (x < 3) penalty += Math.abs(val - (grid[x+1][y] ? grid[x+1][y].value : 0));
      if (y < 3) penalty += Math.abs(val - (grid[x][y+1] ? grid[x][y+1].value : 0));
    }
  }
  return (sum * 4 - penalty) * 2;
},

search: function (grid, step) {
  if (step == this.maxSteps) return this.estimate(grid);
  //var bestMove = Math.floor(Math.random() * 4);
  var scores = {};
  for (var dir = 0; dir < 4; dir++) {
    var before = window.game.grid.serialize().cells;
    window.game.grid.cells = window.game.grid.fromState(grid);
    var r = window.game.move(dir, false, true);
    window.game.grid.cells = window.game.grid.fromState(before);
    if (!r.moved) continue;
    var score = r.moveScore;
    var empty = this.countEmpty(r.afterGrid);
    if (r.over) {
      score -= 10**20;
    } else {
      for (var x = 0; x < window.game.grid.size; x++) {
        for (var y = 0; y < window.game.grid.size; y++) {
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
},

searchAlgorithm: function () {
  if (window.game.isGameTerminated()) return; // Don't do anything if the game's over
  var empty = this.countEmpty(window.game.grid.cells);
  this.maxSteps = empty < 4 ? 3 : 2;
  var bestDir = this.search(window.game.grid.serialize().cells, 0);
  return bestDir;
},

getBestMove: function () {
  return this.searchAlgorithm();
},
}},
{name: "Heuristic", author: "NumbersTada", obj: {
estimate: function (grid) {
  var sum = 0;
  var penalty = 0;
  for (var x = 0; x < window.game.grid.size; x++) {
    for (var y = 0; y < window.game.grid.size; y++) {
      var val = grid[x][y] ? grid[x][y].value : 0;
      sum += val;
      if (x < 3) penalty += Math.abs(val - (grid[x+1][y] ? grid[x+1][y].value : 0));
      if (y < 3) penalty += Math.abs(val - (grid[x][y+1] ? grid[x][y+1].value : 0));
    }
  }
  return (sum * 4 - penalty) * 2;
},
getBestMove: function () {
  var results;
  var move = null;
  var max = -1/0;
  for (var dir = 0; dir < 4; dir++) {
    results = window.game.move(dir, false, true);
    if (results && results.moved) {
      var estimation = estimate(results.afterGrid);
      if (estimation > max) {
        max = estimation;
        move = dir;
      }
    }
  }
  return move;
}
}},
{name: "Random Keys", author: "NumbersTada", obj: {
getBestMove: function () {
  return Math.floor(Math.random() * 4)
}
}},
{name: "Random 3 Keys", author: "NumbersTada", obj: {
getBestMove: function () {
  return Math.floor(Math.random() * 3)
}
}},
{name: "Swirl (URDL)", author: "NumbersTada", obj: {
cycle: 0,
getBestMove: function () {
  ++this.cycle;
  this.cycle %= 4;
  return this.cycle;
}
}},
{name: "Priority", author: "NumbersTada", obj: {
getBestMove: function () {
  var results;
  var move = null;
  for (var dir = 0; dir < 4; dir++) {
    results = window.game.move(dir, false, true);
    if (results && results.moved) {
      move = dir;
      break;
    }
  }
  return move;
}
}},
]
