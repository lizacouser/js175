const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const {body, validationResult} = require("express-validator");
const store = require("connect-loki");

const app = express();
const port = 3000;
const host = "localhost";
const LokiStore = store(session);

// let todoLists = require("./lib/seed-data");
const TodoList = require("./lib/todolist");
const Todo = require("./lib/todo");
const { sortTodoLists, sortTodos } = require("./lib/sort");
const req = require("express/lib/request");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));

// tell Express about the format used by the form data
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in ms
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

// set up persistent session data
app.use((req, res, next) => {
  let todoLists = [];

  if("todoLists" in req.session) {
    req.session.todoLists.forEach(todoList => {
      todoLists.push(TodoList.makeTodoList(todoList));
    });
  }
  
  req.session.todoLists = todoLists;
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const getTodoListByID = (searchId, todoLists) => {
  return todoLists.find(list => {
    return list.id === searchId;
  });
}

const getTodoByID = (listID, todoID, todoLists) => {
  let list = getTodoListByID(listID, todoLists);

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
    todoLists: sortTodoLists(req.session.todoLists),
  });
});

// Render the form to add a new list
app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// Render the todos on a given list
app.get("/lists/:listID", (req, res, next) => {

  let id = Number(req.params.listID);
  let todoList = getTodoListByID(id, req.session.todoLists);

  if (todoList === undefined) {
    next(new Error("Not Found."));
  } else {
    res.render("list", {
      todoList: todoList,
      todos: sortTodos(todoList),
    });
  }
});

app.get("/lists/:listID/edit", (req, res, next) => {
  let id = Number(req.params.listID);
  let todoList = getTodoListByID(id, req.session.todoLists);

  if (!todoList) {
    next(new Error("Not Found."));
  } else {
    res.render("edit-list", {
      todoList: todoList,
    });
  }
});

app.post("/lists/:listID/todos/:todoID/toggle", (req, res, next) => {
  let {listID, todoID} = {...req.params};
  let todo = getTodoByID(Number(listID), Number(todoID), req.session.todoLists);

  if (todo) {
    if (todo.isDone()) {
      todo.markUndone();
      req.flash("success", `"${todo.title}" marked incomplete.`);
    } else {
      todo.markDone();
      req.flash("success", `"${todo.title}" completed!`);
    }
    res.redirect(`/lists/${listID}`);
  } else {
    next(new Error("Not Found."));
  }
})

app.post("/lists/:listID/todos/:todoID/destroy", (req, res, next) => {
  let { listID, todoID } = { ...req.params };
  let list = getTodoListByID(Number(listID), req.session.todoLists);
  let todo = getTodoByID(Number(listID), Number(todoID), req.session.todoLists);

  if (todo) {
    let todoIndex = list.findIndexOf(todo);
    list.removeAt(todoIndex);
    req.flash("success", `"${todo.title}" deleted.`);
    res.redirect(`/lists/${listID}`);
  } else {
    next(new Error("Not Found."));
  }
})

app.post("/lists/:listID/destroy", (req, res, next) => {
  let id = Number(req.params.listID);
  let todoList = getTodoListByID(id, req.session.todoLists);

  if (!todoList) {
    next(new Error("Not Found."));
  } else {
    req.session.todoLists.splice(req.session.todoLists.indexOf(todoList), 1);
    req.flash("success", `"${todoList.title}" deleted.`);
    res.redirect(`/lists`);
  }
})

app.post("/lists/:listID/complete_all", (req, res, next) => {
  let listID = req.params.listID;
  let list = getTodoListByID(Number(listID), req.session.todoLists);

  if (!list) {
    next(new Error("Not Found."));
  } else {
    list.markAllDone();
    req.flash("success", `"${list.title}" completed!`);
    res.redirect(`/lists/${listID}`);
  }
})

app.post("/lists/:listID/todos", 
  [
    body("todoTitle")
      .trim()
      .isLength({min: 1})
      .withMessage('A todo title was not provided')
      .isLength({max: 100})
      .withMessage('Todo title must be between 1 and 100 characters.')
  ],

  (req, res, next) => {
    let listID = req.params.listID;
    let list = getTodoListByID(Number(listID), req.session.todoLists);

    if(!list) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);
      let todoTitle = req.body.todoTitle;

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.render("list", {
          flash: req.flash(),
          todoList: list,
          todos: sortTodos(list),
          todoTitle: todoTitle,
        })
      } else {
        list.add(new Todo(todoTitle));
        req.flash("success", `The todo ${todoTitle} has been created.`);
        res.redirect(`/lists/${listID}`);
      }
    }
  }
);

app.post("/lists/:listID/edit", 
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage('A title was not provided')
      .isLength({max: 100})
      .withMessage('List title must be between 1 and 100 characters.')
      .custom((title, { req }) => {
        return !req.session.todoLists.some(list => list.title === title);
      })
      .withMessage('List title must be unique.')
  ],

  (req, res, next) => {
    let listID = Number(req.params.listID)
    let todoList = getTodoListByID(listID, req.session.todoLists);

    if (!todoList) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => {
          req.flash("error", message.msg);
        });
  
        res.render("edit-list", {
          flash: req.flash(),
          todoList: todoList,
          todoListTitle: req.body.todoListTitle,
        })
      } else {
        let oldTitle = todoList.title;
        todoList.setTitle(req.body.todoListTitle);
        req.flash("success", `${oldTitle} renamed to ${todoList.title}.`)
        res.redirect(`/lists/${listID}`)
      }
    }
  }
);

// post new list data
app.post("/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({min: 1})
      .withMessage('A title was not provided')
      .isLength({max: 100})
      .withMessage('List title must be between 1 and 100 characters.')
      .custom((title, { req }) => {
        return !req.session.todoLists.some(list => list.title === title);
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
      req.session.todoLists.push(new TodoList(req.body.todoListTitle));
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
