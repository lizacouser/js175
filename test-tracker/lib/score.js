class Score {
  constructor(testType, projected, mock) {
    this.test = testType;
    this.projected = projected;
    this.mock = mock;
  }

  isACTScore() {
    return this.test === "ACT";
  }

  isSATScore() {
    return this.test === "SAT";
  }

  isProjected() {
    return this.projected;
  }

  isMock() {
    return this.mock;
  }

  static makeScore(rawScore) {
    return Object.assign(new Score(), rawScore);
  }
}


class SATScore extends Score {
  static MAX_SAT_SCORE = 800;
  static MIN_SAT_SCORE = 400;

  constructor(verbal, math, projected, mock) {
    super("SAT", projected, mock);
    this.verbal = verbal;
    this.math = math;
  }

  getCumulativeScore() {
    return this.verbal + this.math;
  }

  logScore() {
    let starIfProj = (this.isProjected() ? "*" : "");
    let scoreString = "";

    if (this.isMock()) {
      scoreString += "MOCK ";
    }
    scoreString += `${starIfProj}${this.score[0]}V/${starIfProj}${this.score[1]}M`;
    scoreString += ` (${starIfProj}${this.getCumulativeScore()}C)`;

    return scoreString;
  }

  static makeSATScore(rawSATScore) {
    return Object.assign(new SATScore(), rawSATScore);
  }
}

class ACTScore extends Score {
  static MAX_ACT_SCORE = 36;
  static MIN_SAT_SCORE = 1;

  constructor(english, math, reading, science, isProjected, isMock) {
    super("ACT", isProjected, isMock);
    this.english = english;
    this.math = math;
    this.reading = reading;
    this.science = science;
  }

  getCumulativeScore() {
    let numSections = 4;
    let scoreSum = this.english + this.math + this.reading + this.science;
    return Math.round(scoreSum / numSections);
  }

  // eslint-disable-next-line max-lines-per-function
  logScore() {
    let scoreString = "";
    let starIfProj = (this.isProjected() ? "*" : "");

    if (this.isMock()) {
      scoreString += "MOCK ";
    }

    scoreString += `${starIfProj}${this.english}E/${starIfProj}${this.math}M/${starIfProj}${this.reading}R/${starIfProj}${this.science}S`;

    scoreString += ` (${starIfProj}${this.getCumulativeScore()}C)`;
    return scoreString;
  }

  static makeACTScore(rawACTScore) {
    return Object.assign(new ACTScore(), rawACTScore);
  }
}

module.exports = {SATScore, ACTScore};
