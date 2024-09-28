function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 15;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", function(){if (document.querySelector(".restart-button").innerHTML == "Shuffle") this.restart()}.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
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
  btn = document.querySelector(".restart-button");
  btn.innerHTML = "Shuffling...";
  btn.style.background = "#af9a86";
  for (var i = 1; i < this.startTiles+1; i++) {
    const tile = new Tile({x: (i-1)%4, y: Math.floor((i-1)/4)}, i);
    this.grid.insertTile(tile);
  }
  this.shuffle = function(repeat) {
    btn = document.querySelector(".restart-button");
    this.rl = repeat != null ? repeat : this.rl-1;
    var moved = false;
    while (!moved) moved = this.move(Math.floor(Math.random()*4), noScore = true);
    if (this.rl > 0) setTimeout(this.shuffle.bind(this));
    else {
      btn.innerHTML = "Shuffle";
      btn.style.background = "#8f7a66";}
  }
  setTimeout(function(){this.shuffle(300)}.bind(this),1200);
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
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

// Move a tile by exactly one grid space and update its representation
GameManager.prototype.moveTile = function (tile, vector) {
  // Calculate the new position, limited to the grid boundaries
  const newX = cap(0, tile.x + vector.x, this.size - 1);
  const newY = cap(0, tile.y + vector.y, this.size - 1);
  
  // Only move if the new position is available (no tile there)
  if (!this.grid.cellContent({ x: newX, y: newY })) {
    this.grid.cells[tile.x][tile.y] = null;  // Clear the old position
    this.grid.cells[newX][newY] = tile;      // Move to the new position
    tile.updatePosition({ x: newX, y: newY });
  }
};


function cap (min, value, max) {
  return Math.max(Math.min(value,max),min);
}

GameManager.prototype.move = function (direction, noScore = false) {
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var vector = this.getVector(direction); // Direction of movement
  var traversals = this.buildTraversals(vector); // Correct order of traversal
  var moved = false;

  this.prepareTiles();

  // Traverse the grid and move the first movable tile
  outerLoop:
  for (let x of traversals.x) {
    for (let y of traversals.y) {
      const cell = { x: x, y: y };
      const tile = self.grid.cellContent(cell);
      if (tile) {
        const newPosition = { x: cap(0, tile.x + vector.x, self.size - 1), 
                              y: cap(0, tile.y + vector.y, self.size - 1) };
        if (!self.grid.cellContent(newPosition)) {
          self.grid.cells[tile.x][tile.y] = null;  // Clear the old position
          self.grid.cells[newPosition.x][newPosition.y] = tile;  // Move tile
          tile.updatePosition(newPosition);
          moved = true;
          break outerLoop; // Move only one tile, then exit
        }
      }
    }
  }
  if (moved) {
    if (!noScore) this.score++;
    this.actuate();
  }
  var won = true;
  if (!noScore) {
    self.grid.occupiedCells().forEach(tile => {tile = self.grid.cellContent(tile);won = won && tile.value == (tile.x+4*tile.y)+1})
    this.won = won;
    if (won) this.actuate();
  }
  return moved;
};


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

  // Fill both arrays with positions from 0 to the grid size
  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Reverse the traversal order based on movement direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.x === -1) traversals.x = traversals.x;

  if (vector.y === 1) traversals.y = traversals.y.reverse();
  if (vector.y === -1) traversals.y = traversals.y;

  return traversals;
};


GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
