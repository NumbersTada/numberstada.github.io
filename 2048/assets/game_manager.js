function GameManager(sizeX, sizeY, InputManager, Actuator, StorageManager) {
  this.sizeX          = sizeX;
  this.sizeY          = sizeY;
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;
  this.guiScale       = 1;
  this.dark           = false;
  this.debug          = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("undo", this.undo.bind(this));
  this.inputManager.on("closeTileValueInputBox", function () {document.getElementById("tile-value-input-overlay").style.display = "none"});
  this.inputManager.on("okTileValueInputBox", this.applyTileValue.bind(this));
  this.inputManager.on("openSettings", function () {document.getElementById("settings-overlay").style.display = "flex"});
  this.inputManager.on("closeSettings", function () {document.getElementById("settings-overlay").style.display = "none"});
  this.inputManager.on("esc", function () {
    document.getElementById("settings-overlay").style.display = "none";
    document.getElementById("tile-value-input-overlay").style.display = "none";
  });

  function cap(value, min, max) {return Math.min(Math.max(min, value), max)};
  var self = this;
  document.getElementById("board-scale-input").addEventListener("blur", function () {self.guiScale = parseFloat(this.value) || 1; self.actuator.continueGame; self.setup(undoNoReset = true, closePopups = false)});
  document.getElementById("width-input").addEventListener("blur", function () {self.sizeX = cap(parseInt(this.value) || 4, 1, 64); self.applySize()});
  document.getElementById("height-input").addEventListener("blur", function () {self.sizeY = cap(parseInt(this.value) || 4, 1, 64); self.applySize()});

  var settings = this.storageManager.getSettings();
  if (settings) {
    this.dark     = settings.dark;
    this.guiScale = settings.guiScale;
  } else {
    this.dark     = false;
    this.guiScale = 1;
  };

  const urlParams = new URLSearchParams(window.location.search);
  const width = parseInt(urlParams.get("width"));
  const height = parseInt(urlParams.get("height"));
  if (width && height) this.storageManager.setSelected(width, height);
  //else this.delParams("width","height")

  this.setup();
  this.timeUpdateInit();
  this.checkboxInit();

  this.setParam("width", this.sizeX);
  this.setParam("height", this.sizeY);

  this.movemp3 = new Audio("assets/sounds/move.mp3");
  this.merge1mp3 = new Audio("assets/sounds/merge1.mp3");
  this.merge2mp3 = new Audio("assets/sounds/merge2.mp3");
  this.merge3mp3 = new Audio("assets/sounds/merge3.mp3");
  this.click1mp3 = new Audio("assets/sounds/click1.mp3");
  this.click2mp3 = new Audio("assets/sounds/click2.mp3");


  this.UNMERGABLE = ["immovable", "unmergable"];
  this.IMMOVABLE = ["immovable"];
}

GameManager.prototype.getGoal = function () {
  var total = this.sizeX * this.sizeY;
  var adjust = total <= 8 ? 0 : total <= 10 ? -1 : total <= 13 ? -3 : total <= 16 ? -5 : total <= 20 ? -7 : total <= 25 ? -9 : -16
  var current = Math.max(4, 2 ** (total + adjust))
  var max = null;
  this.grid.eachCell(function (x, y, tile) {if (tile) {max = Math.max(max, tile.value)}})
  while (current <= max) {
    current *= 2;
  };
  return current
}


GameManager.prototype.delParams = function (...keys) {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  keys.forEach(key => {params.delete(key)});
  url.search = params.toString();
  window.history.replaceState({}, "", url);
}

GameManager.prototype.setParam = function (key, value) {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  params.set(key, value);
  url.search = params.toString();
  window.history.replaceState({}, "", url);
}


GameManager.prototype.tileClickInit = function () {
  var self = this;
  function callback (event, isTile = true) {
    if (!self.debug) return;
    event.preventDefault();
    var tileElement = isTile ? event.target.parentElement : event.target;
    if (isTile) {var position = Array.from(tileElement.classList).find(cls => cls.startsWith("tile-position-")).replace(/^tile-position-/, "").split("-")}
    else {var position = Array.from(tileElement.classList).find(cls => cls.startsWith("grid-cell-position-")).replace(/^grid-cell-position-/, "").split("-")};
    self.selTileX = parseInt(position[0]) - 1;
    self.selTileY = parseInt(position[1]) - 1;
    
    var current = self.grid.cells[self.selTileX][self.selTileY]
    if (!current) current = "";
    else current = current.value || "";
    if (current != "") current = current.toString();
    document.getElementById("tile-value-input").value = current;
    document.getElementById("tile-value-input-title").innerText = "Set Tile Value at (" + self.selTileX + ", " + self.selTileY + ")";
    document.getElementById("tile-value-input-overlay").style.display = "flex";
  }
  document.querySelector(".tile-container").addEventListener("contextmenu", callback);
  document.querySelectorAll(".grid-cell").forEach(cell => {cell.addEventListener("contextmenu", function (event) {callback(event, isTile = false)})});
};

GameManager.prototype.applyTileValue = function () {
  var value = document.getElementById("tile-value-input").value;
  var intValue = parseFloat(value);
  if (value === "") this.grid.removeTile({x: this.selTileX, y: this.selTileY});
  else this.grid.insertTile(new Tile({x: this.selTileX, y: this.selTileY}, intValue ? intValue : value));
  document.getElementById("tile-value-input-overlay").style.display = "none";
  this.prepareTiles();
  this.actuate();
};

GameManager.prototype.setDarkMode = function(enabled) {
  if (enabled) {
    this.dark = true;
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark-mode");
    document.querySelector(".game-container").style.background = "#a19383";
    document.querySelector(".score-container").style.background = "#3c3a33";
    document.querySelector(".best-container").style.background = "#3c3a33";
    document.querySelector(".restart-button").style.background = "#e46848";
    document.querySelector(".undo-button").style.background = "#e46848";
    document.querySelector(".dialog-box").style.background = "#3b3836";
    document.querySelector("#settings-dialog-box").style.background = "#3b3836";
    //document.querySelector('input[type="text"], input[type="number"]').style.background = "#4d4136";
    
  } else {
    this.dark = false;
    document.body.classList.remove("dark-mode");
    document.documentElement.classList.remove("dark-mode");
    document.querySelector(".game-container").style.background = "#bbada0";
    document.querySelector(".score-container").style.background = "#bbada0";
    document.querySelector(".best-container").style.background = "#bbada0";
    document.querySelector(".restart-button").style.background = "#8f7a66";
    document.querySelector(".undo-button").style.background = "#8f7a66";
    document.querySelector(".dialog-box").style.background = "#eee4da";
    document.querySelector("#settings-dialog-box").style.background = "#eee4da";
  };
}

GameManager.prototype.checkboxInit = function () {
  var self = this;
  document.getElementById("dark-mode-checkbox").addEventListener("change", function () {self.setDarkMode(this.checked)});
  document.getElementById("debug-mode-checkbox").addEventListener("change", function () {
    if (self.debug && !this.checked) {
      self.debug = this.checked;
      self.restart(closePopups = false)
    } else {
      self.debug = this.checked;
      self.prepareTiles()
    };
    self.actuate();
    });
}

// Restart the game
GameManager.prototype.restart = function (closePopups = true) {
  this.storageManager.clearGameState(this.sizeX, this.sizeY);
  this.previousGrid = null;
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup(false, closePopups);
};

GameManager.prototype.applySize = function () {
  this.storageManager.setSelected(this.sizeX, this.sizeY);
  this.setParam("width", this.sizeX);
  this.setParam("height", this.sizeY);
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup(false, false);
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
GameManager.prototype.setup = function (undoNoReset = false, closePopups = true) {
  if (closePopups) {
    document.getElementById("tile-value-input-overlay").style.display = "none";
    document.getElementById("settings-overlay").style.display = "none";
  };
  var selected = this.storageManager.getSelected().split("x").map(Number);
  this.sizeX = selected[0];
  this.sizeY = selected[1];
  document.getElementById("width-input").value = this.sizeX;
  document.getElementById("height-input").value = this.sizeY;
  var previousState = this.storageManager.getGameState(this.sizeX, this.sizeY);
  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.sizeX, previousState.grid.sizeY,
                                previousState.grid.cells); // Reload grid
    this.over        = previousState.over;
    this.won         = previousState.won;
    if (!undoNoReset) {
      this.score       = previousState.score;
      this.keepPlaying = previousState.keepPlaying;
      this.moves       = previousState.moves;
      this.undos       = previousState.undos;
      this.startTime   = Date.now() - previousState.time;
      this.time        = previousState.time;
      this.debug       = previousState.debug;
    }
  } else {
    this.grid        = new Grid(this.sizeX, this.sizeY);
    this.over        = false;
    this.won         = false;
    if (!undoNoReset) {
      this.keepPlaying = false;
      this.score       = 0;
      this.moves       = 0;
      this.undos       = 0;
      this.startTime   = null;
      this.time        = 0;
    }

    // Add the initial tiles
    this.addStartTiles();
  }
  this.updateGrid();

  // Update the actuator
  this.actuate();
};

GameManager.prototype.updateGrid = function () {
  const gridContainer = document.querySelector(".grid-container");

  var gridHTML = "";

  for (var y = 0; y < this.sizeY; y++) {
    gridHTML += '<div class="grid-row">';
    for (var x = 0; x < this.sizeX; x++) {
      gridHTML += '<div class="grid-cell grid-cell-position-' + (x+1) + "-" + (y+1) + '"></div>';
    }
    gridHTML += "</div>";
  }
  // Apply the generated HTML
  gridContainer.innerHTML = gridHTML;
  this.tileClickInit();
  this.updateGridCSS()
};

GameManager.prototype.updateGridCSS = function () {
  var scale = this.guiScale; // You can change this for bigger boards, 1.22 to make the board fit on the screen

  var containerSize = 500 * scale;
  var sizeA = Math.max(this.sizeX, this.sizeY);
  var padding = Math.max(1, Math.min(15, Math.round(60 / sizeA))) * scale;

  var totalPaddingX = padding * (this.sizeX + 1);
  var totalPaddingY = padding * (this.sizeY + 1);
  var availableWidth = containerSize - totalPaddingX;
  var availableHeight = containerSize - totalPaddingY;
  var tileWidth = Math.floor(Math.min(availableWidth / this.sizeX, availableHeight / this.sizeY));
  var tileHeight = tileWidth;
  var borderRadius = Math.floor(tileWidth / 106 * 3 * scale);
  var gameBorderRadius = Math.floor(containerSize / 500 * 6 * scale);
  //borderRadius = 3;       // This mimics the style of other modified games with different grid by keeping the same padding, comment to disable
  //gameBorderRadius = 6;

  var existingStyle = document.querySelector("#dynamic-grid-css");
  if (existingStyle) existingStyle.remove();

  var styleSheet = document.createElement("style");
  styleSheet.id = "dynamic-grid-css";
  styleSheet.type = "text/css";
  var cssContent = `
    .container {
      width: ${containerSize}px; }
    .game-container {
      border-radius: ${gameBorderRadius}px;
      padding: ${padding}px;
      width: ${totalPaddingX + tileWidth * this.sizeX}px;
      height: ${totalPaddingY + tileHeight * this.sizeY}px; }
    .game-container .game-message p {
      margin-top: ${(Math.floor((totalPaddingY + tileHeight * this.sizeY) / 2) - 40) * scale}px; }
    .grid-container {
      width: ${totalPaddingX + tileWidth * this.sizeX}px;
      height: ${totalPaddingY + tileHeight * this.sizeY}px; }
    .grid-row {
      margin-bottom: ${padding}px; }
    .grid-cell {
      border-radius: ${borderRadius}px;
      width: ${tileWidth}px;
      height: ${tileHeight}px;
      margin-right: ${padding}px; }
    .tile, .tile .tile-inner {
      border-radius: ${borderRadius}px;
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

  styleSheet.innerHTML = cssContent;
  document.head.appendChild(styleSheet);
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Set up a board with pregenerated tiles for visual testing
GameManager.prototype.addStartTilesTest = function () {
  var self = this;
  this.grid.eachCell(function (x, y, tile) {
    var tile = new Tile({x: x, y: y}, 2 ** (y * self.sizeX + x + 1));
    self.grid.insertTile(tile);
  })
};



// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    //var special = Math.random() < 0.3 ? Math.random() < 0.5 ? "immovable" : "unmergable" : null
    var special = null;
    var tile = new Tile(this.grid.randomAvailableCell(), special ? 0 : value, special);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.goal = this.getGoal();
  this.actuator.displayTopTile(this.goal);
  document.querySelector(".score-container").style.color = this.debug ? "red" : "white";
  document.getElementById("debug-mode-checkbox").checked = this.debug;
  document.querySelector(".game-intro").innerHTML = this.debug ? "Debug mode is <strong>ON!</strong>" : "Join the numbers and get to the <strong>" + this.goal + " tile!</strong>";
  if (!this.debug) {
    if (this.storageManager.getBestScore(this.sizeX, this.sizeY) < this.score) {
      this.storageManager.setBestScore(this.score, this.sizeX, this.sizeY);
    };
  };

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState(this.sizeX, this.sizeY);
  } else {
    this.storageManager.setGameState(this.serialize(), this.sizeX, this.sizeY);
  }

  this.storageManager.setSettings({dark: this.dark, guiScale: this.guiScale});

  this.setDarkMode(this.dark);
  document.getElementById("dark-mode-checkbox").checked = this.dark;

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(this.sizeX, this.sizeY),
    terminated: this.isGameTerminated(),
    moves:      this.moves,
    undos:      this.undos,
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
    moves:       this.moves,
    undos:       this.undos,
    time:        this.time,
    debug:       this.debug,
  };
};


GameManager.prototype.timeUpdateInit = function () {
  setTimeout(this.timeUpdate.bind(this));
  setTimeout(this.timeSaveUpdate.bind(this));
}

GameManager.prototype.formatTime = function (time) {
  const t = new Date(time);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const s = t.getUTCSeconds();
  const ms = t.getUTCMilliseconds();
  return (h?h+":":"")+(h||m?(""+m).padStart(h?2:0,"0")+":":"")+(""+s).padStart(h||m?2:0,"0")+"."+(""+ms).padStart(3,"0");
}

GameManager.prototype.timeUpdate = function () {
  this.time = this.startTime ? Date.now() - this.startTime : null
  document.getElementById("timeText").innerText = this.formatTime(this.time);
  window.requestAnimationFrame(this.timeUpdate.bind(this));
}

GameManager.prototype.timeSaveUpdate = function () {
  if (this.over) {
    this.storageManager.clearGameState(this.sizeX, this.sizeY);
  } else {
    this.storageManager.setGameState(this.serialize(), this.sizeX, this.sizeY);
  };
  setTimeout(this.timeSaveUpdate.bind(this),1000);
}

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


function deepcopy(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  const copy = Object.create(Object.getPrototypeOf(obj));
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) copy[key] = deepcopy(obj[key]);
  };
  return copy;
}


GameManager.prototype.testFibonacci = function(value) {
  var fib = [1,1]

  while (value > fib[fib.length-1]) fib.push(fib[fib.length-1] + fib[fib.length-2]);
  
  for (var i = 0; i<fib.length && value>=fib[i]; i++) {
    if (value === fib[i]) return true;
  };
  return false;
};



// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction, actuate = true) {
  // 0: up, 1: right, 2: down, 3: left
  function abs(number) {return typeof number == "number" ? Math.abs(number) : number};
  
  var prevState = this.grid.serialize().cells;
  var prevScore = this.score;

  var self = this;
  if (actuate && this.isGameTerminated()) return; // Don't do anything if the game's over
  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var merges     = 0;
  // Save the current tile positions and remove merger information
  if (actuate) this.prepareTiles();
  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && abs(next.value) === abs(tile.value) && !next.mergedFrom && !self.UNMERGABLE.includes(next.special) && !self.UNMERGABLE.includes(tile.special)) {
//        if (next && self.testFibonacci(tile.value + next.value) && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value + next.value);
          if (actuate) merged.mergedFrom = [tile, next];
          merges++;
          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          if (actuate) {
          // Update the score
            self.score += Math.abs(merged.value);
            // The mighty 2048 tile
            if (merged.value == self.goal) self.won = true;
          }
        } else if (!self.IMMOVABLE.includes(tile.special)) {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();
    if (actuate) {
      if (!this.startTime && actuate) this.startTime = Date.now() + this.time;
      this.previousGrid = prevState;
      this.previousScore = prevScore;
      if (!this.movesAvailable()) this.over = true;
      this.moves += 1;
      this.actuate();
      var sound = "";
      if (merges == 0) audio = this.movemp3;
      if (merges == 1) audio = this.merge1mp3;
      if (merges == 2) audio = this.merge2mp3;
      if (merges >= 3) audio = this.merge3mp3;
      audio.currentTime = 0;
      audio.play();
    };
  }
  return moved;

};

GameManager.prototype.undo = function () {
  if (this.previousGrid) {
    this.actuator.clearMessage();
    this.setup(noTimeReset = true);
    this.undos += 1;
    this.moves -= 1;
    this.grid.cells = this.grid.fromState(this.previousGrid);
    this.score = this.previousScore;
    this.previousGrid = null;
    this.previousScore = null;
    this.actuator.continueGame(); // Clear the game won/lost message
    this.click2mp3.currentTime = 0;
    this.click2mp3.play();
    this.actuate();
  } else {
    this.click1mp3.currentTime = 0;
    this.click1mp3.play();
  }
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
  var possible = false;
  for (var dir = 0; dir < 4; dir++) {
    var gridClone = deepcopy(this.grid);
    var gridBackup = this.grid;
    this.grid = gridClone;
    const moved = this.move(dir, actuate = false);
    possible = possible || moved;
    this.grid = gridBackup;
  };
  return possible;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
