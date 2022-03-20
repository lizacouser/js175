const nextId = require("./next-id");

class Test {
  static MAX_SAT_SCORE = 800;
  static MIN_SAT_SCORE = 400;

  static PACK_ORDER = {
    SAT: ["2020 SAT Blue Book", "SAT Pack A", "SAT Pack B", "SAT Mocks"],
    ACT: ["21-22 ACT Red Book", "ACT Pack A", "ACT Pack B", "ACT Mocks"]
  }

  static PACKS = {
    "2020 SAT Blue Book": [
      "BB10", "BB9", "BB8", "BB7",
      "BB6", "BB5", "BB3", "BB1",
    ],
    "SAT Pack A": [
      "Oct 2021 US", "May 2021 Int", "May 2021 US",
      "Mar 2021 US", "Dec 2020 Int", "Oct 2020 US"
    ],
    "SAT Pack B": [
      "Mar 2020 US", "Apr 2019 US", "Mar 2019 US", "May 2019 US",
      "May 2018 US", "Apr 2018 US", "Mar 2018 US"
    ],
    "SAT Mocks": ["May 2019 Int", "Oct 2019 US (Backup)"],

    "21-22 ACT Red Book": [
      "RB1", "RB2", "RB3", "RB4", "RB5", "RB6",
    ],
    "ACT Pack A": [
      "ACT 39.5", "ACT 40", "ACT 41", "ACT 42", "ACT 44",
      "ACT 45", "ACT 47", "ACT 48", "ACT 49"
    ],
    "ACT Pack B": [
      "ACT 21", "ACT 22", "ACT 23", "ACT 27", "ACT 30",
      "ACT 31", "ACT 33", "ACT 36", "ACT 38"
    ],
    "ACT Mocks": ["ACT 39", "ACT 32 (Backup)", "ACT 46 (Backup)"],
  };

  constructor(title, plan, testPack) {
    this.id = nextId();
    this.title = title;
    this.done = false;
    this.testPack = testPack;
    this.plan = plan;
  }

  isACT() {
    return this.plan === "ACT";
  }

  isSAT() {
    return this.plan === "SAT";
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

  setScore(score, projected, mock) {
    // if (this.isValidScore(score)) {
    //   this.score = score;
    //   this.isProjected = projected;
    //   this.isMock = mock;
    // }
    this.score = score;
    this.isProjected = projected;
    this.isMock = mock;
  }

  clearScore() {
    this.score = null;
    this.isProjected = null;
    this.mock = null;
  }

  // isValidScore() {
  //   let isNonZeroArray = (Array.isArray(this.score) || this.score.length !== 0);
  //   let allIntegers = this.score.every(sectionScore => {
  //     return Number.isInt(sectionScore);
  //   });

  //   let inRange = this.score.every(sectionScore => {
  //     return this.isSAT() ?
  //       sectionScore >= Test.MIN_SAT_SCORE &&
  //       sectionScore >= Test.MAX_SAT_SCORE :
  //       sectionScore >= Test.MIN_ACT_SCORE &&
  //       sectionScore >= Test.MAX_ACT_SCORE;
  //   });

  //   return isNonZeroArray && allIntegers && inRange;
  // }

  getScore() {
    return this.score;
  }

  getTitle() {
    return this.title;
  }

  getCumulativeScore() {
    let scoreSum = this.score.reduce((acc, val) => acc + val);
    if (this.isSAT()) {
      return scoreSum;
    } else if (this.isACT()) {
      return Math.round(scoreSum / this.score.length);
    } else {
      return null;
    }
  }

  // eslint-disable-next-line max-lines-per-function
  logScore() {
    let scoreString = "";
    if (Array.isArray(this.score)) {
      // eslint-disable-next-line max-len
      let starIfProj = (this.isProjected ? "*" : "");

      if (this.isMock) {
        scoreString += "MOCK ";
      }

      if (this.isSAT()) {
        scoreString += `${starIfProj}${this.score[0]}V/${starIfProj}${this.score[1]}M`;
      }

      if (this.isACT()) {
        scoreString += `${starIfProj}${this.score[0]}E/${starIfProj}${this.score[1]}M/${starIfProj}${this.score[2]}R/${starIfProj}${this.score[3]}S`;
      }

      scoreString += ` (${starIfProj}${this.getCumulativeScore()}C)`;
    } else {
      scoreString += `No Score`;
    }
    return scoreString;
  }

  static makeTest(rawTest) {
    return Object.assign(new Test(), rawTest);
  }
}

Test.DONE_MARKER = "X";
Test.UNDONE_MARKER = " ";

module.exports = Test;
