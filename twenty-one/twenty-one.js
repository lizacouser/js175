const express = require('express');
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const TwentyOneGame = require('./lib/game');
const sortGames = require('./lib/sortGames');
const store = require("connect-loki");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set('views', './views');
app.set('view engine', 'pug');

app.use(morgan("common"));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false}));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-twenty-one-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, _res, next) => {
  let games = [];
  if ("games" in req.session) {
    req.session.games.forEach(game => {
      games.push(TwentyOneGame.makeGame(game));
    });
  }

  req.session.games = games;
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const loadGame = (gameID, games) => {
  return games.find(game => game.id === gameID);
};


app.get('/', (req, res) => {
  res.render('home', {
    games: sortGames(req.session.games),
  });
});

app.get('/new', (_req, res) => {
  res.render('new-game');
});

app.get('/:gameID', (req, res, next) => {
  let gameID = req.params.gameID;
  let currentGame = loadGame(+gameID, req.session.games);

  if (currentGame === undefined) {
    next(new Error("Not found."));
  } else {
    res.render('game-home', {
      game: currentGame,
    });
  }
});


app.get(`/:gameID/results`, (req, res, next) => {
  let gameID = req.params.gameID;
  let currentGame = loadGame(+gameID, req.session.games);

  if (currentGame === undefined) {
    next(new Error("Not found."));
  } else {
    currentGame.claimWinnings();
    currentGame.setTimeLastPlayed(new Date());

    res.render('results', {
      game: currentGame,
      moves: req.session.moves,
    });
  }
});


app.post("/:gameID/destroy", (req, res, next) => {
  let gameID = req.params.gameID;
  let index = req.session.games.findIndex(game => {
    return game.id === +gameID;
  });

  if (index === -1) {
    next(new Error("Not Found."));
  } else {
    req.session.games.splice(index, 1);

    req.flash("success", "Game deleted");
    res.redirect("/");
  }
});

app.post('/new',
  [
    body("gameTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The game title is required.")
      .isLength({ max: 100 })
      .withMessage("Game title must be between 1 and 100 characters.")
      .custom((title, { req }) => {
        let games = req.session.games;
        let duplicate = games.find(game => game.title === title);
        return duplicate === undefined;
      })
      .withMessage("Game title must be unique."),
  ],

  [
    body("playerStartingAmount")
      .notEmpty()
      .withMessage("The starting amount is required.")
      .bail()
      .isInt({ min: 1, max: 100 })
      .withMessage(`Starting amount must be between 1 and 100.`)
  ],

  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-game", {
        flash: req.flash(),
        gameTitle: req.body.gameTitle,
        playerStartingAmount: req.body.playerStartingAmount,
      });
    } else {
      let title = req.body.gameTitle;
      let playerStartingAmt = Number(req.body.playerStartingAmount);
      let defaultBetSize = 1;

      let newGame = new TwentyOneGame(title, defaultBetSize, playerStartingAmt);

      req.session.games.push(newGame);
      req.flash("success", "The game has been created.");

      res.redirect(`/${newGame.id}`);
    }
  }
);

app.post(`/:gameID/bet`, (req, res, next) => {
  let gameID = req.params.gameID;
  let currentGame = loadGame(+gameID, req.session.games);

  if (currentGame === undefined) {
    next(new Error("Not found."));
  } else {
    res.render('bet', {
      game: currentGame,
    });
  }
});

app.post(`/:gameID/play`,
  [
    body("playerBetSize")
      .notEmpty()
      .withMessage("The bet size is required.")
      .bail()
      .isInt({ min: 1, max: 10 })
      .withMessage(`Bet must be between 1 and 10.`)
  ],

  (req, res, next) => {
    let gameID = req.params.gameID;
    let currentGame = loadGame(+gameID, req.session.games);

    if (currentGame === undefined) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.render("bet", { flash: req.flash(), playerBetSize: req.body.playerBetSize, game: currentGame});
      } else {
        currentGame.player.setBetSize(+req.body.playerBetSize);
        currentGame.deck.reset();
        currentGame.dealStartingHands();

        res.render('player-move', {game: currentGame});
      }
    }
  }
);


app.post(`/:gameID/hit`, (req, res, next) => {
  let gameID = req.params.gameID;
  let currentGame = loadGame(+gameID, req.session.games);

  if (currentGame === undefined) {
    next(new Error("Not found."));
  } else {
    currentGame.hit(currentGame.player);

    if (currentGame.player.isBusted()) {
      req.session.moves = [];
      res.redirect(`/${gameID}/results`);
    }

    res.render('player-move', {
      game: currentGame,
    });
  }
});

app.post(`/:gameID/stay`, (req, res, next) => {
  let gameID = req.params.gameID;
  let currentGame = loadGame(+gameID, req.session.games);

  if (currentGame === undefined) {
    next(new Error("Not found."));
  } else {
    let moves = [];

    while (currentGame.dealerUnderThreshold()) {
      currentGame.hit(currentGame.dealer);
      moves.push("hit");
    }

    if (currentGame.dealer.isBusted()) {
      moves.push("BUSTED!");
    } else {
      moves.push("stayed");
    }

    req.session.moves = moves;

    res.redirect('results');
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Twenty-One is listening on port ${port} of ${host}!`);
});
