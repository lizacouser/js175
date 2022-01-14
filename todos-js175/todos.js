const express = require("express");
const morgan = require("morgan");

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
app.post("/lists", (req, res) => {
  let title = req.body.todoListTitle.trim();
  todoLists.push(new TodoList(title));
  res.redirect("/lists");
});

app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
})
