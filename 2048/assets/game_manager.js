function GameManager(sizeX, sizeY, InputManager, Actuator, StorageManager) {
  this.sizeX          = sizeX;
  this.sizeY          = sizeY;
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("applySettings", this.applySettings.bind(this));

  this.setup();
  this.sliderInit();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState(this.sizeX, this.sizeY);
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

GameManager.prototype.applySettings = function () {
  this.sizeX = parseInt(this.sliderX.value);
  this.sizeY = parseInt(this.sliderY.value);
  this.storageManager.setSelected(this.sizeX, this.sizeY);
  this.setup();
}
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
  var selected = this.storageManager.getSelected().split("x").map(Number);
  this.sizeX = selected[0];
  this.sizeY = selected[1];
  var previousState = this.storageManager.getGameState(this.sizeX, this.sizeY);

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.sizeX, previousState.grid.sizeY,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
    this.sizeX       = previousState.sizeX;
    this.sizeY       = previousState.sizeY;
  } else {
    this.grid        = new Grid(this.sizeX, this.sizeY);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }
  this.updateGrid();
  // Update the actuator
  this.actuate();
};

GameManager.prototype.updateGrid = function () {
  const gridContainer = document.querySelector(".grid-container");

  let gridHTML = "";

  for (let y = 0; y < this.sizeY; y++) {
    gridHTML += '<div class="grid-row">';
    for (let x = 0; x < this.sizeX; x++) {
      gridHTML += '<div class="grid-cell"></div>';
    }
    gridHTML += "</div>";
  }
  // Apply the generated HTML
  gridContainer.innerHTML = gridHTML;
  this.updateGridCSS()
};

GameManager.prototype.updateGridCSS = function () {
  const containerSize = 500;
  const sizeA = Math.max(this.sizeX, this.sizeY);
  const padding = Math.max(2, Math.min(15, Math.floor(60 / sizeA)));

  const totalPaddingX = padding * (this.sizeX + 1);
  const totalPaddingY = padding * (this.sizeY + 1);
  const availableWidth = containerSize - totalPaddingX;
  const availableHeight = containerSize - totalPaddingY;
  const tileWidth = Math.min(availableWidth / this.sizeX, availableHeight / this.sizeY);
  const tileHeight = tileWidth;

  const existingStyle = document.querySelector("#dynamic-grid-css");
  if (existingStyle) existingStyle.remove();

  const styleSheet = document.createElement("style");
  styleSheet.id = "dynamic-grid-css";
  styleSheet.type = "text/css";
  var cssContent = `
    .container {
      /*width: ${totalPaddingX + tileWidth * this.sizeX}px; */}
    .game-container {
      padding: ${padding}px;
      width: ${totalPaddingX + tileWidth * this.sizeX}px;
      height: ${totalPaddingY + tileHeight * this.sizeY}px; }
    .grid-container {
      width: ${totalPaddingX + tileWidth * this.sizeX}px;
      height: ${totalPaddingY + tileHeight * this.sizeY}px; }
    .grid-row {
      margin-bottom: ${padding}px; }
    .grid-cell {
      width: ${tileWidth}px;
      height: ${tileHeight}px;
      margin-right: ${padding}px; }
    .tile, .tile .tile-inner {
      width: ${tileWidth}px;
      height: ${tileHeight}px;
      line-height: ${tileHeight}px; }
  `;

  for (var x = 0; x < this.sizeX; x++) {
    for (var y = 0; y < this.sizeY; y++) {
      var translateX = x * (tileWidth + padding);
      var translateY = y * (tileHeight + padding);
      cssContent += `
        .tile.tile-position-${x + 1}-${y + 1} {
          transform: translate(${translateX}px, ${translateY}px);
        }
      `;
    }
  }
  this.actuator.tileHeight = tileHeight;
  // Apply the dynamically generated CSS
  styleSheet.innerHTML = cssContent;
  document.head.appendChild(styleSheet);
};

GameManager.prototype.sliderInit = function () {
  var self = this;

  this.sliderX = document.getElementById("sizeXslider");
  var outputX = document.getElementById("sizeXtext")
  this.sliderX.value = this.sizeX;
  outputX.textContent = this.sliderX.value;
  this.sliderX.oninput = function() {outputX.textContent = this.value};

  this.sliderY = document.getElementById("sizeYslider");
  var outputY = document.getElementById("sizeYtext")
  this.sliderY.value = this.sizeY;
  outputY.textContent = this.sliderY.value;
  this.sliderY.oninput = function() {outputY.textContent = this.value};
}

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
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore(this.sizeX, this.sizeY) < this.score) {
    this.storageManager.setBestScore(this.score, this.sizeX, this.sizeY);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize(), this.sizeX, this.sizeY);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(this.sizeX, this.sizeY),
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
    keepPlaying: this.keepPlaying,
    sizeX:       this.sizeX,
    sizeY:       this.sizeY
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
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

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
          var merged = new Tile(positions.next, tile.value + next.value);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });


  if (!this.movesAvailable()) {
    this.over = true; // Game over!
    this.actuate();
  } else if (moved) {
    this.addRandomTile();
    this.actuate();
  }

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

  // Account for rectangular boards
  for (var pos = 0; pos < this.sizeX; pos++) {
    traversals.x.push(pos);
  }
  for (var pos = 0; pos < this.sizeY; pos++) {
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

  for (var x = 0; x < this.sizeX; x++) {
    for (var y = 0; y < this.sizeY; y++) {
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
