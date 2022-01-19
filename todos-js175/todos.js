const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const {body, validationResult} = require("express-validator");

const app = express();
const port = 3000;
const host = "localhost";

let todoLists = require("./lib/seed-data");
const TodoList = require("./lib/todolist");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));

// tell Express about the format used by the form data
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
}));

app.use(flash());

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// return the list of todo lists sorted by completion status and title.
const sortTodoLists = lists => {
  function compareByTitle(listA, listB) {
    let titleA = listA.title.toLowerCase();
    let titleB = listB.title.toLowerCase();

    if (titleA < titleB) {
      return -1;
    } else if (titleA > titleB) {
      return 1;
    } else {
      return 0;
    }
  };

  let sortedDoneLists = lists
    .filter(list => list.isDone())
    .sort(compareByTitle);

  let sortedUndoneLists = lists
    .filter(list => !list.isDone())
    .sort(compareByTitle);

  return [].concat(sortedUndoneLists, sortedDoneLists);
};

// Render the list of todo lists
app.get("/", (req, res) => {
  res.redirect("/lists")
});

// Render the list of todo lists
app.get("/lists", (req, res) => {
  res.render("lists", {
    todoLists: sortTodoLists(todoLists),
  });
});

// Render the form to add a new list
app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// post new list data
app.post("/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage('A title was not provided')
      .isLength({max: 100})
      .withMessage('List title must be between 1 and 100 characters.')
      .custom(title => {
        return !todoLists.some(list => list.title === title);
      })
      .withMessage('List title must be unique.')
  ],


  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-list", {
        flash: req.flash(),
        todoListTitle: req.body.todoListTitle,
      })
    } else {
      todoLists.push(new TodoList(req.body.todoListTitle));
      req.flash("success", "The todo list has been created.");
      res.redirect("/lists");
  }
});

app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
})
