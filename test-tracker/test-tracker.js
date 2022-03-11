/* eslint-disable max-lines-per-function */
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const Student = require("./lib/student");
// const Test = require("./lib/test");
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
    body("baselineV")
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
        baselineV: req.body.baselineV,
        studentBaselineMath: req.body.studentBaselineMath
      });
    } else {
      let baseline = [
        +req.body.baselineV,
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
app.post("/students/:studentId/tests/:testId/toggle",
  [
    body("verbalScore")
      .optional({ checkFalsy: true })
      .isInt({ min: 400, max: 800 })
      .withMessage(`Verbal score must be between 400 and 800.`)
  ],

  [
    body("mathScore")
      .optional({ checkFalsy: true })
      .isInt({ min: 400, max: 800 })
      .withMessage(`Math score must be between 400 and 800.`)
  ],

  // eslint-disable-next-line max-lines-per-function
  // eslint-disable-next-line max-statements
  (req, res, next) => {
    let { studentId, testId } = { ...req.params };
    let student = loadStudent(+studentId, req.session.students);

    if (!student) {
      next(new Error("Not found."));
    } else {
      let test = loadTest(+studentId, +testId, req.session.students);
      if (!test) {
        next(new Error("Not Found."));
      } else {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
          errors.array().forEach(message => req.flash("error", message.msg));

          res.render("student", {
            flash: req.flash(),
            student: student,
            tests: sortTests(student.tests),
            verbalScore: req.body.verbalScore,
            mathScore: req.body.mathScore});
        } else {
          let title = test.title;
          if (test.isDone()) {
            test.markUndone();
            test.clearScore();
            req.flash("success", `"${title}" marked as NOT done!`);
          } else {
            test.setScore(req.body.verbalScore, req.body.mathScore, req.body.projected, req.body.mock);
            test.markDone();
            req.flash("success", `"${title}" marked done.`);
          }
          res.redirect(`/students/${studentId}`);
        }
      }
    }
  }
);

// Delete a student
app.post("/students/:studentId/destroy", (req, res, next) => {
  let studentId = req.params.studentId;

  let index = req.session.students.findIndex(student => {
    return student.id === +studentId;
  });

  if (index === -1) {
    next(new Error("Not found."));
  } else {
    req.session.students.splice(index, 1);

    req.flash("success", "Student deleted.");
    res.redirect("/");
  }
});

// Mark all todos as done
app.post("/students/:studentId/complete_all", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    student.markAllDone();
    req.flash("success", "All todos have been marked as done.");
    res.redirect(`/students/${studentId}`);
  }
});

// // Create a new todo and add it to the specified list
// app.post("/lists/:todoListId/todos", (req, res, next) => {
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

// Render edit todo list form
app.get("/students/:studentId/edit", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    res.render("edit-list", { student });
  }
});

// Delete todo list
app.post("/students/:studentId/destroy", (req, res, next) => {
  let students = req.session.students;
  let studentId = +req.params.studentId;
  let index = students.findIndex(student => student.id === studentId);
  if (index === -1) {
    next(new Error("Not found."));
  } else {
    students.splice(index, 1);

    req.flash("success", "Student deleted.");
    res.redirect("/students");
  }
});

// Edit todo list title
app.post("/students/:studentId/edit",
  [
    body("studentName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The student name is required.")
      .isLength({ max: 100 })
      .withMessage("Student name must be between 1 and 100 characters.")
      .custom((title, { req }) => {
        let students = req.session.students;
        let duplicate = students.find(student => student.title === title);
        return duplicate === undefined;
      })
      .withMessage("Student name must be unique."),
  ],

  [
    body("baselineV")
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

  (req, res, next) => {
    let studentId = req.params.studentId;
    let student = loadStudent(+studentId, req.session.students);
    if (!student) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("edit-list", {flash: req.flash(), studentName: req.body.studentName, student: student, baselineV: req.body.baselineV, studentBaselineMath: req.body.studentBaselineMath});
      } else {
        student.setName(req.body.studentName);
        student.setBaseline([req.body.baselineV, req.body.studentBaselineMath]);
        req.flash("success", "Student updated.");
        res.redirect(`/students/${studentId}`);
      }
    }
  }
);

// Error handler
app.use((err, _req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Test Tracker is listening on port ${port} of ${host}!`);
});