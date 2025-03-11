function EventRateTracker() {
  this.timestamps = [];
}

EventRateTracker.prototype.recordEvent = function() {
  this.timestamps.push(Date.now());
  this.removeOld();
};

EventRateTracker.prototype.removeOld = function () {
  var now = Date.now();
  while (this.timestamps.length > 0 && this.timestamps[0] < now - 1000) {
    this.timestamps.shift();
  }
}

EventRateTracker.prototype.getRate = function() {
  return this.timestamps.length;
};

EventRateTracker.prototype.reset = function() {
  this.timestamps = [];
};
