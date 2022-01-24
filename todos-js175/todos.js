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
const { sortTodoLists, sortTodos } = require("./lib/sort");

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

const getTodoListByID = (searchId) => {
  return todoLists.find(list => {
    return list.id === searchId;
  });
}

const getTodoByID = (listID, todoID) => {
  let list = getTodoListByID(listID);

  if (!list) {
    return undefined;
  } else {
    return list.findById(todoID);
  }
}

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

// Render the todos on a given list
app.get("/list/:listID", (req, res, next) => {

  let id = Number(req.params.listID);
  let todoList = getTodoListByID(id);

  if (todoList === undefined) {
    next(new Error("Not Found."));
  } else {
    res.render("list", {
      todoList: todoList,
      todos: sortTodos(todoList),
    });
  }
});

app.post("/lists/:listID/todos/:todoID/toggle", (req, res, next) => {
  let {listID, todoID} = {...req.params};
  let todo = getTodoByID(Number(listID), Number(todoID));

  if (todo) {
    if (todo.isDone()) {
      todo.markUndone();
      req.flash("success", `"${todo.title}" marked incomplete.`);
    } else {
      todo.markDone();
      req.flash("success", `"${todo.title}" completed!`);
    }
    res.redirect(`/list/${listID}`);
  } else {
    next(new Error("Not Found."));
  }
})

app.post("/lists/:listID/todos/:todoID/destroy", (req, res, next) => {
  let { listID, todoID } = { ...req.params };
  let list = getTodoListByID(Number(listID));
  let todo = getTodoByID(Number(listID), Number(todoID));

  if (todo) {
    let todoIndex = list.findIndexOf(todo);
    list.removeAt(todoIndex);
    req.flash("success", `"${todo.title}" deleted.`);
    res.redirect(`/list/${listID}`);
  } else {
    next(new Error("Not Found."));
  }
})

app.post("/lists/:listID/complete_all", (req, res, next) => {
  let listID = req.params.listID;
  let list = getTodoListByID(Number(listID));

  if (!list) {
    next(new Error("Not Found."));
  } else {
    list.markAllDone();
    req.flash("success", `"${list.title}" completed!`);
    res.redirect(`/list/${listID}`);
  }
})

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
  }
);

app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
})
