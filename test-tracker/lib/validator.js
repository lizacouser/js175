const { body } = require('express-validator');

module.exports = {
  name: body("studentName")
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

  baselineV: body("baselineV")
    .optional({ checkFalsy: true })
    .isInt({ min: 400, max: 800 })
    .withMessage(`SAT Verbal score must be between 400 and 800.`),

  baselineM: body("baselineM")
    .optional({ checkFalsy: true })
    .isInt({ min: 400, max: 800 })
    .withMessage(`SAT Math score must be between 400 and 800.`),

  baselineE: body("baselineE")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 36 })
    .withMessage(`ACT English score must be between 1 and 36.`),

  baselineACTm: body("baselineACTm")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 36 })
    .withMessage(`ACT Math score must be between 1 and 36.`),

  baselineR: body("baselineR")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 36 })
    .withMessage(`ACT Reading score must be between 1 and 36.`),

  baselineS: body("baselineS")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 36 })
    .withMessage(`ACT Science score must be between 1 and 36.`),

  // containsBoth: body(["baselineV", "baselineM", "baselineE", "baselineACTm", "baselineR", "baselineS"])
  //   // eslint-disable-next-line max-len
  //   .custom((baselineV, baselineM, baselineE, baselineACTm, baselineR, baselineS) => {
  //     return (baselineV === 7 && baselineM === 7) /* ||
  //       (baselineE && baselineACTm && baselineR && baselineS)*/;
  //   })
  //   .withMessage('All section scores required.'),
};