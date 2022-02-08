const READLINE = require('readline-sync');
const nextId = require("./next-id");
const Deck = require('./deck')
const {Player, Dealer} = require('./players')

class TwentyOneGame {
  static INITIAL_CARDS_DEALT = 2;
  static DEALER_HIT_THRESHOLD = 17;
  // static BET_SIZE = 1;
  // static STARTING_DOLLARS = 5;

  constructor(title, playerBetSize, playerStartingDollars) {
    this.id = nextId();
    this.title = title;
    this.player = new Player(playerBetSize, playerStartingDollars);
    this.dealer = new Dealer(TwentyOneGame.DEALER_HIT_THRESHOLD);
    this.deck = new Deck();
    this.participants = [this.player, this.dealer];
  }

  play() {
    this.displayWelcomeMessage();
    this.player.logWinnings();

    while (true) {
      this.playOneGame();
      this.claimWinnings();
      this.player.logWinnings();

      if (this.player.isBroke() || this.player.isRich()) break;

      if (!this.playAgain()) break;
      console.clear();
    }

    if (this.player.isBroke()) {
      console.log("You're broke!");
    } else if (this.player.isRich()) {
      console.log("You're rich!");
    }

    this.displayGoodbyeMessage();
  }

  playOneGame() {
    this.deck.reset();
    this.dealStartingHands();
    this.playerMove();

    if (!this.player.isBusted()) {
      this.dealerMove();
    }

    console.clear();
    this.displayFullHands();
    this.displayResults();
  }

  displayWelcomeMessage() {
    console.clear();
    console.log("Welcome to Twenty One!\n");
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

  displayFullHands() {
    this.participants.forEach(participant => participant.displayFullHand());

    console.log(`Your total is ${this.player.getHandSum()}`);
    console.log(`Dealer total is ${this.dealer.getHandSum()}`);
  }

  playerMove() {
    let hitOrStay;

    while (true) {
      this.displayStartingHands();
      hitOrStay = this.getPlayerChoice();

      if (hitOrStay === "h") {
        this.hit(this.player);

        console.clear();
        this.player.logMove("hit");

      } else {
        break;
      }

      if (this.player.isBusted()) break;
    }
  }

  dealerMove() {
    while (true) {

      if (this.dealerUnderThreshold()) {
        this.hit(this.dealer);

        console.clear();
        this.dealer.logMove("hits");
        this.displayFullHands();

      } else {
        this.dealer.logMove("stays");
        this.userReadyFor("results");
        break;
      }

      if (this.dealer.isBusted()) break;
      this.userReadyFor("the next move");
    }
  }

  userReadyFor(nextStep) {
    let seeNextStep = READLINE.question(`Press enter to see ${nextStep}:`);

    return seeNextStep;
  }

  getPlayerChoice() {
    let choice;
    while (true) {
      choice = READLINE.question("Would you like to hit or stay? (h/s)");

      if (["h", "s"].includes(choice.toLowerCase())) break;

      console.log("Not a valid response. Try again.");
    }

    return choice.toLowerCase();
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

    if (this.player.isBusted()) {
      console.log("You busted! DEALER WINS :(");
    } else if (this.dealer.isBusted()) {
      console.log("Dealer busted! YOU WIN :)");
    } else if (playerTotal === dealerTotal) {
      console.log("It's an exact tie! Wow!");
    } else {
      console.log(dealerTotal < playerTotal ? "You win!" : "Dealer Wins!");
    }
    console.log("");
  }


  playAgain() {
    let choice;

    while (true) {
      choice = READLINE.question("Would you like to play again? (y/n)");

      if (["y", "n"].includes(choice.toLowerCase())) break;

      console.log("Not a valid response. Try again.");
    }

    return choice.toLowerCase() === "y";
  }

  displayGoodbyeMessage() {
    console.log("");
    console.log("Thanks for playing! Goodbye.");
    console.log("");
  }

  static makeGame(rawGame) {
    let game = Object.assign(new TwentyOneGame(), {
      id: rawGame.id,
      title: rawGame.title,
      player: Player.makePlayer(rawGame.player),
      dealer: Dealer.makeDealer(rawGame.dealer),
      deck: Deck.makeDeck(rawGame.deck),
    });

    game.participants = [game.player, game.dealer];

    return game;
  }
}

module.exports = TwentyOneGame;

/*
P:
rules
-52 card deck (heart, diamond, club, spades, 2,3,4,5,6,7,8,9,10,j,q,k,a)
-get as close to 21 as possible without busting
-dealer + player each have 2 cards.
-player can see both of their own cards,
but player can only see one of dealer's cards
-JQK are all worth 10 points
-ace is worth 11 if the sum doesn't exceed 21
-ace is worth 1 if the sum would exceed 21

-player turn
  -play goes first and decides to hit or stay
  -hit means another card is dealt
  -stay means no
  -player can hit as many times as they want
  -if they bust, the game ends

-dealer turn
  -dealer has to hit until the total is 17 or higher

-if both the dealer and player stay, you sum the cards
to see who has the most points

"Dealer has: Ace and unknown card"
"You have: 2 and 8"

*/
