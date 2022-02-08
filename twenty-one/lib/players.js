const Card = require("./card");


class Participant {
  static BUST_NUMBER = 21

  constructor(name) {
    this.name = name;
    this.clearHand();
  }

  addCardToHand(card) {
    this.hand.push(card);
  }

  clearHand() {
    this.hand = [];
  }

  getHandSum() {
    let sum = this.hand.reduce((sum, card) => {
      return card.getValue() + sum;
    }, 0);

    let highAce = this.getHighAce();

    if (highAce && (sum > Participant.BUST_NUMBER)) {
      highAce.convertToLowAce();
      sum = this.getHandSum();
    }

    return sum;
  }

  getHighAce() {
    return this.hand.find(card => {
      return card.getName() === "A" && card.getValue() === Card.HIGH_ACE_VALUE;
    });
  }

  isBusted() {
    return this.getHandSum() > Participant.BUST_NUMBER;
  }

  getLastCard() {
    return this.hand[this.hand.length - 1].getName();
  }

  logMove(move) {
    console.log(`${this.name} ${move}!`);
  }

  displayFullHand() {
    let cards = [];
    this.hand.forEach(card => {
      cards.push(card.getTitle());
    });

    let fullHand = "";
    fullHand += `${this.name}: `;
    fullHand += cards.join(', ');

    return fullHand;
  }
}

class Player extends Participant {
  static BROKE_THRESHOLD = 0;
  static RICH_THRESHOLD = 10;

  constructor(betSize, startingDollars) {
    super("You");
    this.winnings = startingDollars;
    this.betSize = betSize;
  }

  getBetSize() {
    return this.betSize;
  }

  logBetSize() {
    return `You're betting $${this.getBetSize()} each turn`;
  }

  getWinnings() {
    return this.winnings;
  }

  deductFromWinnings() {
    this.winnings -= this.betSize;
  }

  addToWinnings() {
    this.winnings += this.betSize;
  }

  isBroke() {
    return this.winnings <= Player.BROKE_THRESHOLD;
  }

  isRich() {
    return this.winnings >= Player.RICH_THRESHOLD;
  }

  logWinnings() {
    return `You have $${this.winnings}.`;
  }

  static makePlayer(rawPlayer) {
    let player = Object.assign(new Player(), {
      name: rawPlayer.name,
      winnings: rawPlayer.winnings,
      betSize: rawPlayer.betSize,
      hand: rawPlayer.hand,
    });

    return player;
  }

}

class Dealer extends Participant {
  // static HIT_THRESHOLD = 17;

  constructor(hitThreshold) {
    super("Dealer");
    this.hitThreshold = hitThreshold;
  }

  getHitThreshold() {
    return this.hitThreshold;
  }

  displayHiddenHand() {
    let hiddenHand = ""
    hiddenHand += "Dealer: ";

    let visibleCard = this.hand[0];

    hiddenHand += visibleCard.getTitle() + " ";
    hiddenHand += "and unknown card";

    return hiddenHand;
  }

  static makeDealer(rawDealer) {
    let dealer = Object.assign(new Dealer(), {
      name: rawDealer.name,
      hitThreshold: rawDealer.hitThreshold,
      hand: rawDealer.hand,
    });

    return dealer;
  }
}

module.exports = {Player, Dealer}