[
{name: "Random Keys", author: "pluh", obj: {
  getBestMove: function () {
    return Math.floor(Math.random() * 4)
  }
}},
{name: "Random 3 Keys", author: "pluh", obj: {
  getBestMove: function () {
    return Math.floor(Math.random() * 3)
  }
}},
{name: "Swirl", author: "Mangos", obj: {
  cycle: 0,
  getBestMove: function () {
    ++this.cycle;
    this.cycle %= 4;
    return this.cycle;
  }
}}
]
