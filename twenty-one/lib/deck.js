const Card = require("./card");

class Deck {
  static SUITS = ["Spades", "Hearts", "Diamonds", "Clubs"]
  static NUMBER_VALUES = {
    2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 7, 8: 8, 9: 9, 10: 10,
    J: Card.FACECARD_VALUE,
    Q: Card.FACECARD_VALUE,
    K: Card.FACECARD_VALUE,
    A: Card.HIGH_ACE_VALUE
  }

  constructor() {
    this.reset();
  }

  reset() {
    this.cards = [];
    Deck.SUITS.forEach(suit => {
      Object.keys(Deck.NUMBER_VALUES).forEach(num => {
        let val = Deck.NUMBER_VALUES[num];
        this.cards.push(new Card(num, val, suit));
      });
    });

    this.shuffle();
  }

  dealCard() {
    return this.cards.pop();
  }

  shuffle() {
    let cards = this.cards;

    for (let index = cards.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }
  }

  static makeDeck(rawDeck) {
    return new Deck();
  }
}

module.exports = Deck;