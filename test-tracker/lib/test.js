const nextId = require("./next-id");

class Test {
  static PACKS = {
    "2020 Blue Book": [
      "BB10", "BB9", "BB8", "BB7",
      "BB6", "BB5", "BB3", "BB1",
    ],
    // "Test Pack A": [
    //   "Oct 2021 US", "May 2021 Int", "May 2021 US",
    //   "Mar 2021 US", "Dec 2020 Int", "Oct 2020 US"
    // ],
    // "Test Pack B": [
    //   "Mar 2020 US", "Apr 2019 US", "Mar 2019 US", "May 2019 US",
    //   "May 2018 US", "Apr 2018 US", "Mar 2018 US"
    // ],
    // "Mocks": ["May 2019 Int", "Oct 2019 US (Backup)"],
  };

  constructor(title, testPack) {
    this.id = nextId();
    this.title = title;
    this.done = false;
    this.testPack = testPack;
  }

  toString() {
    let marker = this.isDone() ? Test.DONE_MARKER : Test.UNDONE_MARKER;
    return `[${marker}] ${this.title}`;
  }

  markDone() {
    this.done = true;
    this.dateTaken = new Date();
  }

  setDateTaken(year, month, day) {
    this.dateTaken = new Date(year, month, day);
  }

  markUndone() {
    this.done = false;
  }

  isDone() {
    return this.done;
  }

  setTitle(title) {
    this.title = title;
  }

  setScore(verbal, math) {
    this.score = [verbal, math];
  }

  getScore() {
    return this.score;
  }

  getTitle() {
    return this.title;
  }

  logScore() {
    return `Score: ${this.score[0]}V/${this.score[1]}M`;
  }

  static makeTest(rawTest) {
    return Object.assign(new Test(), rawTest);
  }
}

Test.DONE_MARKER = "X";
Test.UNDONE_MARKER = " ";

module.exports = Test;
