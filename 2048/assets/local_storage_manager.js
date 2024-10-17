window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey          = "bestScore";
  this.gameStateKey          = "gameState";
  this.selectedKey           = "selected";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";
  var storage = window.localStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function (x, y) {
  return this.storage.getItem(this.bestScoreKey + x + "x" + y) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score, x, y) {
  this.storage.setItem(this.bestScoreKey + x + "x" + y, score);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function (x, y) {
  var stateJSON = this.storage.getItem(this.gameStateKey + x + "x" + y);
  return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function (gameState, x, y) {
  this.storage.setItem(this.gameStateKey + x + "x" + y, JSON.stringify(gameState));
};

LocalStorageManager.prototype.getSelected = function () {
  return this.storage.getItem(this.selectedKey) || "4x4";
}

LocalStorageManager.prototype.setSelected = function (x, y) {
  this.storage.setItem(this.selectedKey, x + "x" + y);
}

LocalStorageManager.prototype.clearGameState = function (x, y) {
  this.storage.removeItem(this.gameStateKey + x + "x" + y);
};