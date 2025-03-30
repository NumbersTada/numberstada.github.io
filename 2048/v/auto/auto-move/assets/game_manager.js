function GameManager(size, InputManager, Actuator, StorageManager, AutoManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator(this);
  this.autoManager    = new AutoManager(this);

  this.startTiles     = 2;
  this.moving         = false;
  this.autoButton     = document.querySelector(".auto-button");
  this.autoRestartButton = document.querySelector(".auto-restart-button");
  this.bots           = [];
  this.topTiles       = {};
  this.autoRestart    = false;
  this.downloadBots();

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("toggleAutoMove", this.toggleAutoMove.bind(this));
  this.inputManager.on("step", function () {this.autoStep(true)}.bind(this));
  this.inputManager.on("resetStats", this.autoManager.resetStats.bind(this.autoManager));
  this.inputManager.on("autoRestart", this.toggleAutoRestart.bind(this));

  this.stopAutoMove();

  this.setup();
}

GameManager.prototype.downloadBots = function () {
  fetch("https://raw.githubusercontent.com/NumbersTada/numberstada.github.io/refs/heads/main/2048/v/auto/auto-move/bots.js", {cache: "no-store"})
    .then(response => response.text())
    .then(data => {
      window.game.bots = eval(data); // Scary, but you can't add your own bots without verification (unless you hack my GitHub :skull:)
      window.game.selectedBot = window.game.bots[0];
      window.game.actuator.updateBotContainer();
    })
    .catch(error => alert("Error while downloading bots: " + error.toString()));
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    value = 2;
    var cell = this.grid.randomAvailableCell();
    this.grid.insertTile(new Tile(cell, value));
    /*
    while (!this.movesAvailable()) {
      value *= 2;
      this.grid.insertTile(new Tile(cell, value));
    }*/
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  if (this.over && this.autoRestart) this.restart();

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction, actuate = true, simulate = false) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var over       = false;

  var previousGrid = this.grid.serialize().cells;
  var previousScore = this.score;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  var moveScore = this.score - previousScore;
  var afterGrid = this.grid.serialize().cells

  if (moved) {
    this.addRandomTile();

    if (simulate) {
      over = !this.movesAvailable();
      this.grid.cells = this.grid.fromState(previousGrid);
      this.score = previousScore;
    } else {
      if (!this.movesAvailable()) {
        over = true;
        this.over = true;
        var max = 0;
        this.grid.eachCell(function (x, y, tile) {
          if (tile && tile.value > max) max = tile.value;
        });
        if (!this.topTiles[max]) this.topTiles[max] = 0;
        this.topTiles[max]++;
      }
      if (actuate) this.actuate();
    }
  }
  return {moved: moved, over: over, moveScore: moveScore, previousGrid: previousGrid, afterGrid: afterGrid}
};

GameManager.prototype.autoStep = function (single = false) {
  if (!this.selectedBot || !this.bots) {
    this.stopAutoMove();
    return alert("Please wait for the bots to load.");
  }
  if (!this.selectedBot.obj) {
    this.stopAutoMove();
    return alert("Bot has no moving function!");
  }
  if (!this.isGameTerminated()) {
    if (single) this.autoManager.oneMove();
    else this.autoManager.move();
  }
}

GameManager.prototype.autoMove = function () {
  this.autoStep();
  if (this.moving) window.requestAnimationFrame(this.autoMove.bind(this));
}

GameManager.prototype.startAutoMove = function () {
  this.moving = true;
  this.autoButton.textContent = "Stop Auto Move";
  this.autoButton.style.background = "#b3987f";
  this.autoMove();
}
GameManager.prototype.stopAutoMove = function () {
  this.moving = false;
  this.autoButton.textContent = "Start Auto Move";
  this.autoButton.style.background = "#8f7a66";
}
GameManager.prototype.toggleAutoMove = function () {
  if (this.moving) this.stopAutoMove();
  else this.startAutoMove();
}

GameManager.prototype.changeBot = function (bot) {
  this.selectedBot = bot;
}

GameManager.prototype.toggleAutoRestart = function () {
  this.autoRestart = !this.autoRestart;
  this.autoRestartButton.textContent = "Auto Restart: " + (this.autoRestart ? "ON" : "OFF");
  this.autoRestartButton.style.background = this.autoRestart ? "#b3987f" : "#8f7a66";
}

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
