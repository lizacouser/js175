const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const Student = require("./lib/student");
const Test = require("./lib/test");
const { sortStudents, sortTests } = require("./lib/sort");
const store = require("connect-loki");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "test-tracker-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, _res, next) => {
  let students = [];
  if ("students" in req.session) {
    req.session.students.forEach(student => {
      students.push(Student.makeStudent(student));
    });
  }

  req.session.students = students;
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});


const loadStudent = (studentId, students) => {
  return students.find(student => student.id === studentId);
};

// Find a todo with the indicated ID in the indicated todo list. Returns
// `undefined` if not found. Note that both `todoListId` and `todoId` must be
// numeric.
const loadTest = (studentId, testId, students) => {
  let student = loadStudent(studentId, students);
  if (!student) return undefined;

  return student.tests.find(test => test.id === testId);
};

// Redirect start page
app.get("/", (_req, res) => {
  res.redirect("/students");
});

// Render the list of todo lists
app.get("/students", (req, res) => {
  res.render("students", {
    students: sortStudents(req.session.students),
  });
});

// Render new todo list page
app.get("/students/new", (_req, res) => {
  res.render("new-student");
});

// Create a new todo list
app.post("/students",
  [
    body("studentName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Student Name is required.")
      .isLength({ max: 100 })
      .withMessage("Name must be between 1 and 100 characters.")
      .custom((name, { req }) => {
        let students = req.session.students;
        let duplicate = students.find(student => student.name === name);
        return duplicate === undefined;
      })
      .withMessage("Student name must be unique."),
  ],

  [
    body("studentBaselineVerbal")
      .notEmpty()
      .withMessage("The baseline verbal score is required.")
      .bail()
      .isInt({ min: 400, max: 800 })
      .withMessage(`Baseline verbal score must be between 400 and 800.`)
  ],

  [
    body("studentBaselineMath")
      .notEmpty()
      .withMessage("The baseline math score is required.")
      .bail()
      .isInt({ min: 400, max: 800 })
      .withMessage(`Baseline math score must be between 400 and 800.`)
  ],

  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-student", {
        flash: req.flash(), studentName: req.body.studentName,
        studentBaselineVerbal: req.body.studentBaselineVerbal,
        studentBaselineMath: req.body.studentBaselineMath
      });
    } else {
      let baseline = [
        +req.body.studentBaselineVerbal,
        +req.body.studentBaselineMath
      ];

      let student = new Student(req.body.studentName, baseline);
      req.session.students.push(student);
      req.flash("success", "The student has been created.");
      res.redirect(`/students/${student.id}`);
    }
  }
);

// Render individual todo list and its todos
app.get("/students/:studentId", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (student === undefined) {
    next(new Error("Not found."));
  } else {
    res.render("student", {
      student: student,
      tests: sortTests(student.tests),
    });
  }
});

// Toggle completion status of a todo
app.post("/students/:studentId/tests/:testId/toggle", (req, res, next) => {
  let { studentId, testId } = { ...req.params };
  let test = loadTest(+studentId, +testId, req.session.students);
  if (!test) {
    next(new Error("Not found."));
  } else {
    let title = test.title;
    if (test.isDone()) {
      test.markUndone();
      req.flash("success", `"${title}" marked as NOT done!`);
    } else {
      test.markDone();
      req.flash("success", `"${title}" marked done.`);
    }

    res.redirect(`/students/${studentId}`);
  }
});

// // Delete a todo
// app.post("/lists/:todoListId/todos/:todoId/destroy", (req, res, next) => {
//   let { todoListId, todoId } = { ...req.params };

//   let todoList = loadTodoList(+todoListId, req.session.todoLists);
//   if (!todoList) {
//     next(new Error("Not found."));
//   } else {
//     let todo = loadTodo(+todoListId, +todoId, req.session.todoLists);
//     if (!todo) {
//       next(new Error("Not found."));
//     } else {
//       todoList.removeAt(todoList.findIndexOf(todo));
//       req.flash("success", "The todo has been deleted.");
//       res.redirect(`/lists/${todoListId}`);
//     }
//   }
// });

// // Mark all todos as done
// app.post("/lists/:todoListId/complete_all", (req, res, next) => {
//   let todoListId = req.params.todoListId;
//   let todoList = loadTodoList(+todoListId, req.session.todoLists);
//   if (!todoList) {
//     next(new Error("Not found."));
//   } else {
//     todoList.markAllDone();
//     req.flash("success", "All todos have been marked as done.");
//     res.redirect(`/lists/${todoListId}`);
//   }
// });

// // Create a new todo and add it to the specified list
// app.post("/lists/:todoListId/todos",
//   [
//     body("todoTitle")
//       .trim()
//       .isLength({ min: 1 })
//       .withMessage("The todo title is required.")
//       .isLength({ max: 100 })
//       .withMessage("Todo title must be between 1 and 100 characters."),
//   ],
//   (req, res, next) => {
//     let todoListId = req.params.todoListId;
//     let todoList = loadTodoList(+todoListId, req.session.todoLists);
//     if (!todoList) {
//       next(new Error("Not found."));
//     } else {
//       let errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         errors.array().forEach(message => req.flash("error", message.msg));

//         res.render("list", {flash: req.flash(), todoList: todoList, todos: sortTodos(todoList), todoTitle: req.body.todoTitle});
//       } else {
//         let todo = new Todo(req.body.todoTitle);
//         todoList.add(todo);
//         req.flash("success", "The todo has been created.");
//         res.redirect(`/lists/${todoListId}`);
//       }
//     }
//   }
// );

// // Render edit todo list form
// app.get("/lists/:todoListId/edit", (req, res, next) => {
//   let todoListId = req.params.todoListId;
//   let todoList = loadTodoList(+todoListId, req.session.todoLists);
//   if (!todoList) {
//     next(new Error("Not found."));
//   } else {
//     res.render("edit-list", { todoList });
//   }
// });

// // Delete todo list
// app.post("/lists/:todoListId/destroy", (req, res, next) => {
//   let todoLists = req.session.todoLists;
//   let todoListId = +req.params.todoListId;
//   let index = todoLists.findIndex(todoList => todoList.id === todoListId);
//   if (index === -1) {
//     next(new Error("Not found."));
//   } else {
//     todoLists.splice(index, 1);

//     req.flash("success", "Todo list deleted.");
//     res.redirect("/lists");
//   }
// });

// // Edit todo list title
// app.post("/lists/:todoListId/edit",
//   [
//     body("todoListTitle")
//       .trim()
//       .isLength({ min: 1 })
//       .withMessage("The list title is required.")
//       .isLength({ max: 100 })
//       .withMessage("List title must be between 1 and 100 characters.")
//       .custom((title, { req }) => {
//         let todoLists = req.session.todoLists;
//         let duplicate = todoLists.find(list => list.title === title);
//         return duplicate === undefined;
//       })
//       .withMessage("List title must be unique."),
//   ],
//   (req, res, next) => {
//     let todoListId = req.params.todoListId;
//     let todoList = loadTodoList(+todoListId, req.session.todoLists);
//     if (!todoList) {
//       next(new Error("Not found."));
//     } else {
//       let errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         errors.array().forEach(message => req.flash("error", message.msg));

//         res.render("edit-list", {flash: req.flash(), todoListTitle: req.body.todoListTitle, todoList: todoList});
//       } else {
//         todoList.setTitle(req.body.todoListTitle);
//         req.flash("success", "Todo list updated.");
//         res.redirect(`/lists/${todoListId}`);
//       }
//     }
//   }
// );

// Error handler
app.use((err, _req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Test Tracker is listening on port ${port} of ${host}!`);
});