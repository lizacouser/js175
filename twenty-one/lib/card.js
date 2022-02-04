
class Card {
  static LOW_ACE_VALUE = 1;
  static HIGH_ACE_VALUE = 11;
  static FACECARD_VALUE = 10;

  constructor(name, value, suit) {
    this.name = name;
    this.value = value;
    this.title = `${this.name} of ${suit}`;
  }

  getName() {
    return this.name;
  }

  getValue() {
    return this.value;
  }

  getTitle() {
    return this.title;
  }

  convertToLowAce() {
    this.value = Card.LOW_ACE_VALUE;
  }

}

module.exports = Card;