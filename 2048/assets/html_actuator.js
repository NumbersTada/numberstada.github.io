function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.score = 0;
  this.maxCap = 65536;
  this.minCap = -65536;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  var urlParams = new URLSearchParams(window.location.search);
  this.fullNumbers = parseInt(urlParams.get("fullNumbers"));

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
        if (!self.wlSound) self.wlSound = setTimeout(function () {audio = new Audio("assets/sounds/lose.mp3"); audio.play(); audio.addEventListener("ended", function() {self.wlSound = null}.bind(self))}.bind(self), 1300)
        self.message(false); // You lose
      } else if (metadata.won) {
        if (!self.wlSound) self.wlSound = setTimeout(function () {audio = new Audio("assets/sounds/win.mp3"); audio.play(); audio.addEventListener("ended", function() {self.wlSound = null}.bind(self))}.bind(self), 1300)
        self.message(true); // You win!
      }
    }
    document.getElementById("movesText").innerText = metadata.moves + " move" + (metadata.moves == 1 ? "" : "s");
    document.querySelector(".undo-button").innerText = "Undo (" + metadata.undos + ")";

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
  function abs(number) {return typeof number == "number" ? Math.abs(number) : number};
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > this.maxCap) classes.push("tile-super");
  if (tile.value < this.minCap) classes.push("tile-sub");

  if (tile.special) {
    classes.push("tile-special-" + tile.special);
  }

  this.applyClasses(wrapper, classes);
  inner.classList.add("tile-inner");
  inner.textContent = tile.value;
  var tileSize = this.tileHeight;
  var fontSize = tile.special ? 0 : parseInt((tileSize * 0.6) / ((Math.max(tile.value.toString().length, 2) + 1.3) * 0.33));
  inner.style.fontSize = fontSize + "px";

  var value2 = tile.value;
  tile.value = tile.value.length ? Math.floor(1.5 ** tile.value.length) : tile.value;
  if (tile.value <= this.maxCap && tile.value >= this.minCap && !tile.special) {
    var {backgroundColor, textColor, boxShadow} = this.getAverageColor(tile.value);
    inner.style.backgroundColor = backgroundColor;
    inner.style.color = abs(tile.value) < 1 ? abs(tile.value) <= 0.7 ? "#f9f6f2" : "#776e65" : abs(tile.value) > 4 && abs(tile.value) < 6 ? "#776e65" : abs(tile.value) >= 6 && abs(tile.value) <= 7 ? "#f9f6f2" : textColor;
    inner.style.boxShadow = boxShadow;
  };
  tile.value = value2;

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

HTMLActuator.prototype.displayTopTile = function (tileValue) {
  var wrapper = document.createElement("div");
  var inner = document.createElement("div");

  wrapper.classList.add("tile", "tile-" + tileValue, "top-tile");
  inner.classList.add("tile-inner");
  inner.textContent = tileValue;

  if (tileValue > this.maxCap) wrapper.classList.add("tile-super");
  if (tileValue < this.minCap) wrapper.classList.add("tile-sub");

  var tileSize = 106;
  var fontSize = parseInt((tileSize * 0.6) / ((Math.max(tileValue.toString().length, 2) + 1.3) * 0.33));
  inner.style.fontSize = fontSize + "px";

  var value2 = tileValue;
  tileValue = tileValue.length ? Math.floor(1.5 ** tileValue.length) : tileValue;
  if (tileValue <= this.maxCap && tileValue >= this.minCap) {
    var {backgroundColor, textColor, boxShadow} = this.getAverageColor(tileValue);
    inner.style.backgroundColor = backgroundColor;
    inner.style.color = textColor;
    inner.style.boxShadow = boxShadow;
  };
  tileValue = value2;
  wrapper.style.width = tileSize + "px";
  wrapper.style.height = tileSize + "px";
  inner.style.width = tileSize + "px";
  inner.style.height = tileSize + "px";
  inner.style.lineHeight = tileSize + "px";
  wrapper.appendChild(inner);

  // Append to the top container
  var topContainer = document.querySelector(".top-tile-container");
  if (topContainer) {
    topContainer.innerHTML = "";
    topContainer.appendChild(wrapper);
  }
};


HTMLActuator.prototype.extractTileColors = function () {
  var tileColors = {};
  var textColors = {};
  var boxShadows = {};
  var styleSheets = document.styleSheets;

  for (var i = 0; i < styleSheets.length; i++) {
    try {
      var rules = styleSheets[i].cssRules || styleSheets[i].rules;

      if (rules) {
        for (var j = 0; j < rules.length; j++) {
          var rule = rules[j];
          if (!rule || !rule.selectorText) continue;
          rule = rule.selectorText;
          if (rule && rule.startsWith(".tile.tile-")) {
            var className = rule.replace(".", "");
            var backgroundColor = rules[j].style.backgroundColor;
            var textColor = rules[j].style.color; // Fetch text color
            var boxShadow = rules[j].style.boxShadow; // Fetch box shadow

            tileColors[className] = backgroundColor;
            textColors[className] = textColor;
            boxShadows[className] = boxShadow;
           }
         }
       }
    } catch (e) {console.warn(`Could not access stylesheet: ${styleSheets[i].href}. Error: ${e}`)}
  }
  return {tileColors, textColors, boxShadows};
};

// Update to set the tileColors, textColors, and boxShadows properties
var tileStyles = HTMLActuator.prototype.extractTileColors();
HTMLActuator.prototype.tileColors = tileStyles.tileColors;
HTMLActuator.prototype.textColors = tileStyles.textColors;
HTMLActuator.prototype.boxShadows = tileStyles.boxShadows;
HTMLActuator.prototype.rgbStringToArray = function (rgb) {return rgb.match(/\d+/g).map(Number)}

console.log(tileStyles)

HTMLActuator.prototype.averageColors = function (color1, color2, weight) {
  var rgb1 = this.rgbStringToArray(color1);
  var rgb2 = this.rgbStringToArray(color2);

  return rgb1.map((value, index) => {
    return Math.round(value * weight + rgb2[index] * (1 - weight));
  });
}

HTMLActuator.prototype.averageBoxShadows = function (boxShadow1, boxShadow2, weight = 0.5) {
  function extractFirstRgba(shadow) {
    var rgbaMatch = shadow.match(/rgba?\((\d+), (\d+), (\d+),? ?([\d\.]+)?\)/);
    if (rgbaMatch) return rgbaMatch.slice(1, 4).map(Number);
    return null;
  }
  function getAllShadows(shadow) {
    var shadowPattern = /([^,]+?rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)[^,]*)/g;
    var shadows = [];
    var match;
    while ((match = shadowPattern.exec(shadow)) !== null) shadows.push(match[0].trim());
    return shadows;
  }
  var rgba1 = extractFirstRgba(boxShadow1);
  var rgba2 = extractFirstRgba(boxShadow2);
  var averagedColor = this.averageColors(`rgba(${rgba1.join(",")})`, `rgba(${rgba2.join(",")})`, weight);
  var opacity1 = parseFloat(boxShadow1.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d\.]+)/)[1]) || 0;
  var opacity2 = parseFloat(boxShadow2.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d\.]+)/)[1]) || 0;
  var averagedOpacity = opacity1 * weight + opacity2 * (1 - weight);
  var others = getAllShadows(boxShadow1);
  var newShadow = `0 0 30px 10px rgba(${averagedColor.join(", ")}, ${averagedOpacity}), ` + others;
  return newShadow;
}


HTMLActuator.prototype.getAverageColor = function getAverageColor(value) {
  var colorKey = `tile.tile-${value} .tile-inner`;
  // If defined, get the tile color, text color, and box shadow
  var tileColor = this.tileColors[colorKey] || null;
  var textColor = this.textColors[colorKey] || null;
  var boxShadow = this.boxShadows[colorKey] || null;

  if (tileColor) {
    return {
      backgroundColor: tileColor,
      textColor: textColor,
      boxShadow: boxShadow
    };
  }

  var tileValues = Object.keys(this.tileColors).map(key => parseFloat(key.replace(/^tile\.tile-/, "").replace(/\s.*$/, ""))).filter(val => !isNaN(val));
  var lowerValue = null;
  var upperValue = null;
  for (var num of tileValues) {
    if (num < value) {
      if (lowerValue === null || num > lowerValue) lowerValue = num;
    } else if (num > value) {
      if (upperValue === null || num < upperValue) upperValue = num;
    }
  }

  if (lowerValue == null || upperValue == null) {
    console.warn(`Undefined colors for tile values: ${lowerValue}, ${upperValue}`);
    lowerValue == 0
  }

  var weight = (upperValue - value) / (upperValue - lowerValue);

  var lowerColorKey = `tile.tile-${lowerValue} .tile-inner`;
  var upperColorKey = `tile.tile-${upperValue} .tile-inner`;

  var lowerColor = this.tileColors[lowerColorKey] || "rgb(255, 0, 255)";
  var upperColor = this.tileColors[upperColorKey] || "rgb(255, 0, 255)";

  var averageBackgroundColor = this.averageColors(lowerColor, upperColor, weight);

  var lowerTextColor = this.textColors[lowerColorKey] || "rgb(0, 0, 0)";
  var upperTextColor = this.textColors[upperColorKey] || "rgb(0, 0, 0)";

  var averageTextColor = this.averageColors(lowerTextColor, upperTextColor, weight);

  var lowerBoxShadow = this.boxShadows[lowerColorKey] || "0 0 0 0 rgba(0, 0, 0, 0)"
  var upperBoxShadow = this.boxShadows[upperColorKey] || "0 0 0 0 rgba(0, 0, 0, 0)"

  var averageBoxShadow = this.averageBoxShadows(lowerBoxShadow, upperBoxShadow, weight)

  console.log(lowerBoxShadow, upperBoxShadow, averageBoxShadow)

  return {
    backgroundColor: `rgb(${averageBackgroundColor.join(", ")})`,
    textColor: `rgb(${averageTextColor.join(", ")})`,
    boxShadow: averageBoxShadow
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

HTMLActuator.prototype.formatNumber = function (num) {
    if (num === null || num === undefined) return "";
    var suffixes = ["", "k", "M", "B", "T", "Q"];
    var suffixIndex = 0;
    
    var isNegative = num < 0;
    num = Math.abs(num);
    
    while (num >= 1000 && suffixIndex < suffixes.length - 1) {
        num /= 1000;
        suffixIndex++;
    }
    return (isNegative ? "-" : "") + num.toFixed(num % 1 === 0 ? 0 : 1) + suffixes[suffixIndex];
}


HTMLActuator.prototype.updateScore = function (score) {
  format = function (number) {return this.fullNumbers ? number : this.formatNumber(number)}.bind(this);
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = format(this.score);

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + format(difference);

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  format = function (number) {return this.fullNumbers ? number : this.formatNumber(number)}.bind(this);
  this.bestContainer.textContent = format(bestScore);
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
