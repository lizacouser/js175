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
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, res, next) => {
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
    games: req.session.games,
  });
})

app.get('/new', (req, res) => {
  res.render('new-game');
})

app.get('/:gameID', (req, res) => {
  let gameID = req.params.gameID;

  res.render('game-home', {
    game: loadGame(+gameID, req.session.games),
  });
})

app.post("/:gameID/destroy", (req, res) => {
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
})

app.post('/new', (req, res) => {
  let title = req.body.gameTitle;
  let playerBetSize = req.body.playerBetSize;
  console.log("my bet zie", playerBetSize);
  let playerStartingDollars = 10;
  req.session.games.push(new TwentyOneGame(title, playerBetSize, playerStartingDollars));

  res.redirect('/');
})

// // Error handler
// app.use((err, req, res, _next) => {
//   console.log(err); // Writes more extensive information to the console log
//   res.status(404).send(err.message);
// });

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
