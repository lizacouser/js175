// const READLINE = require('readline-sync');
const nextId = require("./next-id");
const Deck = require('./deck');
const {Player, Dealer} = require('./players');

class TwentyOneGame {
  static INITIAL_CARDS_DEALT = 2;
  static DEFAULT_HIT_THRESHOLD = 17;

  constructor(title, playerBetSize, playerStartingAmt) {
    this.id = nextId();
    this.title = title;
    this.player = new Player(playerBetSize, playerStartingAmt);
    this.dealer = new Dealer(TwentyOneGame.DEFAULT_HIT_THRESHOLD);
    this.deck = new Deck();
    this.participants = [this.player, this.dealer];
    this.timeLastPlayed = new Date();
  }

  dealStartingHands() {
    this.participants.forEach(participant => {
      participant.clearHand();
      participant.addCardToHand(this.deck.dealCard());
      participant.addCardToHand(this.deck.dealCard());
    });
  }

  displayHandTotal() {
    return `Your total is ${this.player.getHandSum()}`;
  }

  getTimeLastPlayed() {
    return this.timeLastPlayed.toString();
  }

  setTimeLastPlayed(date) {
    this.timeLastPlayed = date;
  }

  getWinner() {
    if ((!this.player.isBusted() &&
       this.player.getHandSum() > this.dealer.getHandSum()) ||
       this.dealer.isBusted()) {

      return this.player;

    } else if (this.player.isBusted() ||
              this.player.getHandSum() < this.dealer.getHandSum()) {

      return this.dealer;

    } else {

      return null;
    }
  }

  hit(participant) {
    participant.addCardToHand(this.deck.dealCard());
  }

  dealerUnderThreshold() {
    return this.dealer.getHandSum() < this.dealer.getHitThreshold();
  }

  claimWinnings() {
    let winner = this.getWinner();
    if (this.player === winner) {
      this.player.addToWinnings();
    } else if (this.dealer === winner) {
      this.player.deductFromWinnings();
    }
  }

  displayResults() {
    let playerTotal = this.player.getHandSum();
    let dealerTotal = this.dealer.getHandSum();
    let results;

    if (this.player.isBusted()) {
      results = "You busted! DEALER WINS :(";
    } else if (this.dealer.isBusted()) {
      results = "Dealer busted! YOU WIN :)";
    } else if (playerTotal === dealerTotal) {
      results = "It's an exact tie! Wow!";
    } else {
      results = dealerTotal < playerTotal ? "You win!" : "Dealer Wins!";
    }

    return results;
  }

  static makeGame(rawGame) {
    let game = Object.assign(new TwentyOneGame(), {
      id: rawGame.id,
      title: rawGame.title,
      player: Player.makePlayer(rawGame.player),
      dealer: Dealer.makeDealer(rawGame.dealer),
      deck: new Deck(),
      timeLastPlayed: new Date(rawGame.timeLastPlayed),
    });

    game.participants = [game.player, game.dealer];

    return game;
  }
}

module.exports = TwentyOneGame;