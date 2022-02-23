// Compare object titles alphabetically (case insensitive)
const compareByTitle = (itemA, itemB) => {
  let titleA = itemA.name.toLowerCase();
  let titleB = itemB.name.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

module.exports = {
  sortStudents(students) {
    return students.filter(student => student.name).sort(compareByTitle);
    // let undone = students.filter(student => !student.isDone());
    // let done = students.filter(student => student.isDone());
    // undone.sort(compareByTitle);
    // done.sort(compareByTitle);
    // return [].concat(undone, done);
  },

  sortTests(tests) {
    let done = tests.filter(test => test.isDone());
    let undone = tests.filter(test => !test.isDone());
    return [].concat(undone, done);
  }
};
