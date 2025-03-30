[
{name: "Random Keys", author: "NumbersTada", obj: {
  getBestMove: function () {
    return Math.floor(Math.random() * 4)
  }
}},
{name: "Random 3 Keys", author: "NumbersTada", obj: {
  getBestMove: function () {
    return Math.floor(Math.random() * 3)
  }
}},
{name: "Swirl (URDL)", author: "NumbersTada", obj: {
  cycle: 0,
  getBestMove: function () {
    ++this.cycle;
    this.cycle %= 4;
    return this.cycle;
  }
}},
{name: "Priority", author: "NumbersTada", obj: {
  getBestMove: function () {
    var results;
    var move = null;
    for (var dir = 0; dir < 4; dir++) {
      results = window.game.move(dir, false, true);
      if (results.moved) {
        move = dir;
      }
    }
    return move;
  }
}},
]
