function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof gtag !== "undefined") {
    gtag("event", "restart", {
      event_category: "game",
    });
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  const tileSize = this.tileHeight;
  var fontSize = parseInt((tileSize * 0.6) / ((Math.max(tile.value.toString().length, 2) + 1.3) * 0.33));
  inner.style.fontSize = fontSize + "px";


  if (tile.value < 2048) {
  const { backgroundColor, textColor, boxShadow } = this.getAverageColor(tile.value);

  inner.style.backgroundColor = backgroundColor;
  inner.style.color = tile.value > 4 && tile.value < 6 ? "rgb(119, 110, 101)" : tile.value >= 6 && tile.value <= 7 ? "rgb(249, 246, 242)" : textColor; // This is to make 5, 6, 7 tiles not look weird
  inner.style.boxShadow = boxShadow;
  }
  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.extractTileColors = function () {
    const tileColors = {};
    const textColors = {};
    const boxShadows = {};
    const styleSheets = document.styleSheets;

    for (let i = 0; i < styleSheets.length; i++) {
        try {
            const rules = styleSheets[i].cssRules || styleSheets[i].rules;

            if (rules) {
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j].selectorText;

                    // Check if the rule contains a tile class for tile values
                    if (rule && rule.match(/\.tile-\d+/)) {
                        const className = rule.replace('.', '');
                        
                        // Get background color, text color, and box shadow
                        const backgroundColor = rules[j].style.backgroundColor;
                        const textColor = rules[j].style.color; // Fetch text color
                        const boxShadow = rules[j].style.boxShadow; // Fetch box shadow

                        // Store the class and its associated styles
                        tileColors[className] = backgroundColor;
                        textColors[className] = textColor;
                        boxShadows[className] = boxShadow;
                    }
                }
            }
        } catch (e) {
            console.warn(`Could not access stylesheet: ${styleSheets[i].href}. Error: ${e}`);
        }
    }
    return {tileColors, textColors, boxShadows};
};

// Update to set the tileColors, textColors, and boxShadows properties
const tileStyles = HTMLActuator.prototype.extractTileColors();
HTMLActuator.prototype.tileColors = tileStyles.tileColors;
HTMLActuator.prototype.textColors = tileStyles.textColors;
HTMLActuator.prototype.boxShadows = tileStyles.boxShadows;

console.log(HTMLActuator.prototype.tileColors);
console.log(HTMLActuator.prototype.textColors);
console.log(HTMLActuator.prototype.boxShadows);


HTMLActuator.prototype.rgbStringToArray = function (rgb) {
    return rgb.match(/\d+/g).map(Number);
}

HTMLActuator.prototype.averageColors = function (color1, color2, weight) {
    const rgb1 = this.rgbStringToArray(color1);
    const rgb2 = this.rgbStringToArray(color2);

    return rgb1.map((value, index) => {
        return Math.round(value * weight + rgb2[index] * (1 - weight));
    });
}


HTMLActuator.prototype.getAverageColor = function getAverageColor(value) {
  const colorKey = `tile.tile-${value} .tile-inner`;
  // If defined, get the tile color, text color, and box shadow
  const tileColor = this.tileColors[colorKey] || null;
  const textColor = this.textColors[colorKey] || null;
  const boxShadow = this.boxShadows[colorKey] || null;

  if (tileColor) {
    return {
      backgroundColor: tileColor,
      textColor: textColor,
      boxShadow: boxShadow
    };
  }

  const tileValues = Object.keys(this.tileColors).map(key => parseInt(key.split('-')[1]));
  let lowerValue = null;
  let upperValue = null;

  // Find the closest lower and upper values
  for (const val of tileValues) {
    if (val < value) {
      lowerValue = val;
    } else if (val > value && (upperValue == null || val < upperValue)) {
      upperValue = val;
    }
  }

  if (lowerValue == null || upperValue == null) {
    console.warn(`Undefined colors for tile values: ${lowerValue}, ${upperValue}`);
    lowerValue == 0
  }

  const weight = (upperValue - value) / (upperValue - lowerValue);

  const lowerColorKey = `tile.tile-${lowerValue} .tile-inner`;
  const upperColorKey = `tile.tile-${upperValue} .tile-inner`;

  const lowerColor = this.tileColors[lowerColorKey] || "rgb(255, 0, 255)";
  const upperColor = this.tileColors[upperColorKey] || "rgb(255, 0, 255)";

  const averageBackgroundColor = this.averageColors(lowerColor, upperColor, weight);

  const lowerTextColor = this.textColors[lowerColorKey] || "rgb(0, 0, 0)";
  const upperTextColor = this.textColors[upperColorKey] || "rgb(0, 0, 0)";

  const averageTextColor = this.averageColors(lowerTextColor, upperTextColor, weight);

  const lowerBoxShadow = this.boxShadows[lowerColorKey] || null

  return {
    backgroundColor: `rgb(${averageBackgroundColor.join(', ')})`,
    textColor: `rgb(${averageTextColor.join(', ')})`,
    boxShadow: lowerBoxShadow
  };
}

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof gtag !== "undefined") {
    gtag("event", "end", {
      event_category: "game",
      event_label: type,
      value: this.score,
    });
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
