function Tile(position, value, special = null) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value;
  this.special          = special;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

Tile.prototype.serialize = function () {
  var tile = {
    position: {
      x: this.x,
      y: this.y
    },
    value: this.value,
  };
  if (this.special) tile.special = this.special;
  return tile
};
