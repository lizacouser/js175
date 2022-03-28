/* eslint-disable max-lines-per-function */
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const Student = require("./lib/student");
const Test = require("./lib/test");
const { sortStudents, sortTests } = require("./lib/sort");
const store = require("connect-loki");
const validate = require("./lib/validator");

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

// Find a test with the indicated ID in the indicated student. Returns
// `undefined` if not found.
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
    validate.uniqueName,
    validate.SATScore,
    validate.ACTScore,
  ],

  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-student", {
        flash: req.flash(),
        studentName: req.body.studentName,
        SATVerbal: req.body.SATVerbal,
        SATMath: req.body.SATMath,
        ACTEnglish: req.body.ACTEnglish,
        ACTMath: req.body.ACTMath,
        ACTReading: req.body.ACTReading,
        ACTScience: req.body.ACTScience,
        testPlan: req.body.testPlan,
      });
    } else {
      let baseline = [];
      if (req.body.SATVerbal && req.body.SATMath) {
        baseline = [+req.body.SATVerbal, +req.body.SATMath];
      } else if (
        req.body.ACTEnglish &&
        req.body.ACTMath &&
        req.body.ACTReading &&
        req.body.ACTScience
      ) {
        baseline = [
          +req.body.ACTEnglish,
          +req.body.ACTMath,
          +req.body.ACTReading,
          +req.body.ACTScience,
        ];
      }

      // eslint-disable-next-line max-len
      let student = new Student(req.body.studentName, req.body.testPlan);
      student.setBaseline(baseline);
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

app.get("/students/:studentId/tests/:testId/edit", (req, res, next) => {
  let { studentId, testId } = { ...req.params };
  let student = loadStudent(+studentId, req.session.students);

  if (!student) {
    next(new Error("Not found."));
  } else {
    let test = loadTest(+studentId, +testId, req.session.students);
    if (!test) {
      next(new Error("Not Found."));
    } else {
      res.render("edit-score", { student, test });
    }
  }
});

app.post("/students/:studentId/tests/:testId/clear", (req, res, next) => {
  let { studentId, testId } = { ...req.params };
  let student = loadStudent(+studentId, req.session.students);

  if (!student) {
    next(new Error("Not found."));
  } else {
    let test = loadTest(+studentId, +testId, req.session.students);
    if (!test) {
      next(new Error("Not Found."));
    } else {
      test.clearScore();
      req.flash("success", `"${test.title}" score cleared!`);
      res.render("student", { student,
        tests: sortTests(student.tests),
        flash: req.flash()}
      );
    }
  }
});

// Toggle completion status of a todo
app.post("/students/:studentId/tests/:testId/toggle",
  [
    validate.SATScore,
    validate.ACTScore,
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
            student: student,
            tests: sortTests(student.tests),
            flash: req.flash(),
          });
        } else {
          let title = test.title;
          if (test.isDone()) {
            test.clearScore();
            test.markUndone();
            // eslint-disable-next-line max-depth
            if (student.baseline.name === test.name) {
              student.clearBaseline();
            }
            req.flash("success", `"${title}" marked as NOT done!`);
          } else {
            let score = test.isSAT() ? [
              +req.body.SATVerbal, +req.body.SATMath
            ] : [
              +req.body.ACTEnglish, +req.body.ACTMath,
              +req.body.ACTReading, +req.body.ACTScience,
            ];
            test.setScore(score, req.body.projected, req.body.mock);
            test.markDone();
            // eslint-disable-next-line max-depth
            if (student.noBaseline()) {
              student.baseline = test;
            }
            req.flash("success", `"${title}" marked done.`);
          }
          res.redirect(`/students/${studentId}`);
        }
      }
    }
  }
);

app.post("/students/:studentId/tests/:testId/edit",

  [
    validate.SATScore,
    validate.ACTScore,
  ],

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

          res.render("edit-score", {
            student, test,
            flash: req.flash(),
            SATVerbal: req.body.SATVerbal,
            SATMath: req.body.SATMath,
            ACTEnglish: req.body.ACTEnglish,
            ACTMath: req.body.ACTMath,
            ACTReading: req.body.ACTReading,
            ACTScience: req.body.ACTScience,
          });

        } else {
          let title = test.title;
          let score = test.isSAT() ? [
            +req.body.SATVerbal, +req.body.SATMath
          ] : [
            +req.body.ACTEnglish, +req.body.ACTMath,
            +req.body.ACTReading, +req.body.ACTScience,
          ];
          test.setScore(score, req.body.projected, req.body.mock);
          req.flash("success", `"${title}" score changed.`);
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
    res.redirect("/students");
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
    req.flash("success", "All tests have been marked as done.");
    res.redirect(`/students/${studentId}`);
  }
});

// show all tests
app.post("/students/:studentId/show_all", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    res.render("student", {
      student: student,
      tests: sortTests(student.tests),
    });
  }
});

// filter test display
app.post("/students/:studentId/filter", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    let filteredView = "student";
    switch (req.body.filter) {
      case "latest":
        filteredView += "-latest";
        break;
      case "completed":
        filteredView += "-completed";
        break;
      case "incomplete":
        filteredView += "-incomplete";
        break;
    }
    res.render(filteredView, {
      student: student,
      tests: sortTests(student.tests),
    });
  }
});

// add test pack to student test list
app.post("/students/:studentId/tests", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    let testPacks = Test.PACK_ORDER[student.testPlan];
    let nextIndex = testPacks.indexOf(student.getLatestTestPack()) + 1;

    if (nextIndex < testPacks.length) {
      let nextPack = testPacks[nextIndex];
      student.addTestPack(student.testPlan, nextPack);
      req.flash("success", "Test pack has been added.");
    } else {
      req.flash("error", "No more test packs available.");
    }
    res.redirect(`/students/${studentId}`);
  }
});

// add test pack to student test list
// app.post("/students/:studentId/remove_tests", (req, res, next) => {
//   let studentId = req.params.studentId;
//   let student = loadStudent(+studentId, req.session.students);
//   if (!student) {
//     next(new Error("Not found."));
//   } else {
//     let testPacks = Test.PACK_ORDER[student.testPlan];
//     let latestIndex = testPacks.indexOf(student.latestTestPack);

//     if (latestIndex > 0) {
//       student.removeTestPack(student.latestTestPack);
//       req.flash("success", "Test pack has been removed.");
//     } else {
//       req.flash("error", "Cannot remove first test pack in plan.");
//     }
//     res.redirect(`/students/${studentId}`);
//   }
// });

app.post("/students/:studentId/remove_tests", (req, res, next) => {
  let studentId = req.params.studentId;
  let student = loadStudent(+studentId, req.session.students);
  if (!student) {
    next(new Error("Not found."));
  } else {
    let latest = student.getLatestTestPack();
    let latestTests = student.tests.filter(test => {
      return test.testPack === latest;
    });

    if (latestTests.some(test => test.isDone())) {
      req.flash("error", "Cannot remove completed test.");
    } else if (student.size() === 0) {
      req.flash("error", "No more test packs to remove.");
    } else {
      // student.removeLatestTestPack();
      student.removeTestPack(latest);
      req.flash("success", "Test pack has been removed.");
    }
    res.redirect(`/students/${studentId}`);
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

// Edit student
app.post("/students/:studentId/edit",
  [
    validate.name,
    validate.SATScore,
    validate.ACTScore,
  ],

  // eslint-disable-next-line max-statements
  (req, res, next) => {
    let studentId = req.params.studentId;
    let student = loadStudent(+studentId, req.session.students);
    if (!student) {
      next(new Error("Not found."));
    } else {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        res.render("edit-list", {flash: req.flash(), studentName: req.body.studentName, student: student, SATVerbal: req.body.SATVerbal, SATMath: req.body.SATMath});
      } else {
        let baseline = [];
        if (req.body.SATVerbal && req.body.SATMath) {
          baseline = [+req.body.SATVerbal, +req.body.SATMath];
        } else if (
          req.body.ACTEnglish &&
          req.body.ACTMath &&
          req.body.ACTReading &&
          req.body.ACTScience
        ) {
          baseline = [
            +req.body.ACTEnglish,
            +req.body.ACTMath,
            +req.body.ACTReading,
            +req.body.ACTScience,
          ];
        }
        student.setName(req.body.studentName);
        student.setBaseline(baseline);
        student.setTestPlan(req.body.testPlan);
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