// Oh my god this is complete griddy code
// 2024 NumbersTada was on something :skull:
// Bro literally minified the code
// Why is bro putting constants in prototype
// Why is bro not putting any S P A C E S between operators and operands
// Why is bro USING PERL REGEX SYNTAX
// Why is bro using LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNNNNNNGGGGGGGGGGGGGGGG LLLLLLLLLLIIIIIIIIINNNNNNNNNNNEEEEEEESSSSSSS
// Why is bro not using the 2048 extension
// Why is bro even writing these unfunny comments
// BRO DID NOT EVEN CLOSE THE HTML TAG PROPERLY
// I am so sorry for this

function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid        = new Grid(this.size);
  this.kočka       = "mňau"
  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};



const TOILETS = ["skibidi","ohio","sigma","womp","nuh","rizzler","sus","bruh","cringe","freddy"]

GameManager.prototype.SKIBIDI = TOILETS[Math.floor(Math.random()*TOILETS.length)]

console.log(GameManager.prototype.SKIBIDI,TOILETS)

// Adds a SKIBIDI tile in a random position
GameManager.prototype.addRandomTile = function() {
 var reps=0
 while((Math.random()<(this.score>10000?0.8:0.01))||(reps==0)){
  if (this.grid.cellsAvailable()) {
    GameManager.prototype.SKIBIDI = TOILETS[Math.floor(Math.random()*TOILETS.length)]
    var value = 69;
    reps=reps+1
    var filtered=this.grid.cells.flat().filter(obj => obj !== null);
    value=filtered[Math.floor(Math.random() * filtered.length)];
    if(value==undefined){value=2}else{value=value.value}
    if(Math.random()<0.05){value=GameManager.prototype.SKIBIDI}
    if(Math.random()<0.001){value="Skibidi"}
    if(Math.random()<0.001){value="AmongUs"}
    console.log(value)
    const tilef = new Tile(this.grid.availableCells()[0], value);
    const tilel = new Tile(this.grid.availableCells()[this.grid.availableCells().length-1], value);
    var tile = this.score%8==0?tilef:tilel;
    console.log(this.score+" - adding tile to "+(this.score%8==0?"first":"last")+" position")
    this.grid.insertTile(tile);
  }
 }
 if (this.grid.cells.flat().filter(obj => obj !== null).every(kočka => TOILETS.includes(kočka.value)) && this.kočka=="mňau"){
    setTimeout(function(){sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §fdayum you got the perfect spawn lets go you can do this")},500);
    setTimeout(function(){sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §fLETS GOOOOOOOOOOOOO")},1000);
    setTimeout(function(){sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §fwatch out for amogus tiles tho, they only merge with themselves")},2000);
 }
 this.kočka="uaňm"
 return {
      position: tile.x * 4 + tile.y,
      value: tile.value,
    };
};
GameManager.prototype.removeTile = function (tile) {
  if (!tile) return;
  this.grid.cells[tile.x][tile.y] = null;
  this.actuate();
};
// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated()
  });

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
// Function to send a message to the chat
function sendMessageToChat(message,duration=5000) {
  const chatBox = document.getElementById("chat");

  const formattedMessage = message.replace(/§([0-9a-f])/g, (match, code) => {
    return `<span class="mcc${code}">`;
  }).replace(/§r/g, '</span>');


  const messageElement = document.createElement("div");
  messageElement.className = "chat-message";
  messageElement.innerHTML = formattedMessage;

  chatBox.appendChild(messageElement);

  setTimeout(() => {
    messageElement.classList.add("fade-out");
  }, duration - 1000);

  setTimeout(() => {
    chatBox.removeChild(messageElement);
  }, duration);
}


function updateScoreboard(message) {
  const formattedMessage = message.replace(/§([0-9a-f])/g, (match, code) => {
    return `<span class="mcc${code}">`;
  }).replace(/§r/g, '</span>');

  const scoreboard = document.getElementById("scoreboard");

  scoreboard.innerHTML = "";

  const messageElement = document.createElement("div");
  messageElement.className = "sb-message";
  messageElement.innerHTML = formattedMessage;

  scoreboard.appendChild(messageElement);
}


var tokens=0
var balls=0
// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;
  skibidiToiletMerge=false
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
        if ((next && next.value === tile.value && !next.mergedFrom) || (next && TOILETS.includes(next.value) && TOILETS.includes(tile.value) || (next && next.value == tile.value == "Skibidi"))) {
          var multiply = Math.random() < 0.999 ? 2 : 0.5;
          multiply==0.5?sendMessageToChat("<strong>§5P§dP »</strong> §fYou just got <strong>"+mcjoin2("c6eab9d","DIVIDE TROLLED!")+"</strong>§7 Bruh."):0
          var merged = new Tile(positions.next, tile.value=="Skibidi"?"Skibidi":tile.value=="AmongUs"?"AmongUs":TOILETS.includes(tile.value)?GameManager.prototype.SKIBIDI:tile.value * multiply);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);
          skibidiToiletMerge = skibidiToiletMerge || tile.value=="Skibidi"
          // Converge the two tiles' positions
          tile.updatePosition(positions.next);
          self.score += TOILETS.includes(merged.value)?Math.floor(Math.random()*420):merged.value;
          self.skibidiScore=self.score;
          if(typeof self.score=="string"){
            let checksum = 0;
            for(let i=0;i<self.score.length;i++){
                const char=self.score.charCodeAt(i);
                checksum+=char
                console.log(char,checksum)}
            self.score=self.score.match(/\d+/g)*1+checksum
          }
          GameManager.prototype.SKIBIDI = TOILETS[Math.floor(Math.random()*TOILETS.length)];
          // The mighty skibidi toilette tile
          if (TOILETS.includes(merged.value)){
            added=Math.random()<0.001?Math.floor(Math.random()*100000):Math.floor(Math.random()*1000);
            balls += added;
            added>1000?sendMessageToChat("<strong>§5P§dP »</strong> §fYou hit the griddy and got <strong>§a"+added+" BALLS!</strong>§7 You now have §a"+balls+"§7 balls"):null}
          if (balls>=1000000){
            self.won = true;
            sendMessageToChat("<strong>§5P§dP »</strong> §fYou just <strong>"+mcjoin2("c6eab9d","WON THIS GAME!")+"</strong>§7 What a waste of time...")}
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  // sendMessageToChat("<br><strong>§ePVP MINE IS ACTIVE!</strong> §7(/spawn)<br><br>")

  if (moved) {
    this.addRandomTile();
    if(this.grid.cells.flat().filter(obj=>obj!==null).some(obj=>obj.value=="Skibidi")) balls+=Math.floor(Math.random()*10000);
    sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §f" + mangos[Math.floor(Math.random() * mangos.length)]) // this is the only part of 2025 numberstada code
    if(Math.random()<0.003){
    addedTokens=Math.floor(Math.random()*1000);
    tokens+=addedTokens;
    sendMessageToChat("<strong>§5P§dP »</strong> §fYou received a random mining reward of <strong>+"+addedTokens+" tokens</strong>");}

    skibidiToiletMerge?setTimeout(function(){sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §fbro died of skibidi :skull:")},1000):null
    if (!this.movesAvailable() || skibidiToiletMerge) {
      this.over = true; // Game over!
      balls2=balls
      balls=0
      sendMessageToChat("<strong>§5P§dP »</strong> §fYou lost <strong>§c"+balls2+" ball"+(balls2==1?"":"s")+" uhh i mean vbucks!</strong>§7 You now have §c"+balls+"§7 balls")
    }

    this.actuate();
  }
  this.rmove=function(){
    dir=0
    if (!this.canMove(dir)) dir+=1
    if (!this.canMove(dir)) dir+=1
    if (!this.canMove(dir)) dir+=1
    this.move(dir)
    };
 // setTimeout(this.rmove.bind(this),50)
};

const mangos = [
"I should add tiktok ads on the sides",
"Want some Subway Surfers gameplay?",
"From the screen to the ring to the pen to the king",
"Now playing: KSI - Thick Of It (feat. Trippie Redd)",
"mango mango mango mango",
"FREE LUNCHLY at /p h NumbersTada 2",
]

GameManager.prototype.canMove = function (direction) {
  var vector = this.getVector(direction); // Get the vector for the direction
  var self = this;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      var cell = { x: x, y: y };
      var tile = this.grid.cellContent(cell);

      if (tile) {
        var nextCell = { x: x + vector.x, y: y + vector.y };
        if (this.grid.withinBounds(nextCell)) {
          var nextTile = this.grid.cellContent(nextCell);

          // Check if the next cell is empty or if the tiles can merge
          if (!nextTile || nextTile.value === tile.value) {
            return true; // A move in the given direction is possible
          }
        }
      }
    }
  }
}
function randomRun(fn,minDelay,maxDelay) {
  function run() {
    const delay=Math.floor(Math.random()*(maxDelay-minDelay+1))+minDelay;
    setTimeout(run,delay);
    fn();
  }
  run();
}

const messages = ["hi this is the cringiest 2048 game ever","what do you call when you have 2 billion and 2 trillion money? a 2b2t","nuh uh","btw i hate purple prison i just made this for fun","download geometry dash","why are you playing this"]

bruh=function(){
    updateScoreboard("&nbsp;".repeat(8)+"<strong>§5PURPLE §7PRISON</strong>"+"&nbsp;".repeat(8)+"<br>§dWarp:<br>&nbsp;§5·§f /warp rank<br>§dBalls:<br>&nbsp;§5·§f "+balls+"<br>§dBrainrot:<br>&nbsp;§5·§f "+GameManager.prototype.SKIBIDI)
    setTimeout(bruh,100)}
bruh()

randomRun(function(){sendMessageToChat("<br><strong>§ePVP MINE IS ACTIVE!</strong> §7(/spawn)<br><br>")},5000,20000)
randomRun(function(){
    const message = messages[Math.floor(Math.random()*messages.length)]
    sendMessageToChat("<strong><em>§d[§519Z§d]</em></strong>§7 [meower] <strong>§5[§dBruh§5]</strong>§f NumbersTada§7 » §f"+message)},3000,13000)
randomRun(function(){sendMessageToChat("<strong>§5P§dP »</strong> §fYou have unlocked "+mcjoin2("c6eab9d","ULTRA BRUH MODE! Press ALT+f4 to activate it!"))},100000,1000000)
function mcjoin(input,char) {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    result += `§${input[i]}${char}`;
  }
  return result;
  }

function mcjoin2(input,string) {
  let result = "";
  for (let i = 0; i < string.length; i++) {
    result += `§${input.repeat(100)[i]}${string[i]}`;
  }
  return result;
}
// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
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
