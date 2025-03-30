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
}}
]
