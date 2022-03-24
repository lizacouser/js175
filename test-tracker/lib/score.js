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

  toString() {
    let starProjected = (this.isProjected() ? "*" : "");
    let mock = (this.isMock() ? "MOCK" : "");
    let scoreArray = [];
    let cumulative = "";

    if (this.verbal) {
      scoreArray.push(`${starProjected}${this.verbal}V`);
    }

    if (this.math) {
      scoreArray.push(`${starProjected}${this.math}M`);
    }

    if (scoreArray.length === 0) {
      return "No Score";
    }

    if (scoreArray.length === 2) {
      cumulative = `(${starProjected}${this.getCumulativeScore(scoreArray.length)}C)`;
    }

    return `${mock} ${scoreArray.join("/")} ${cumulative}`;
  }

  static makeSATScore(rawSATScore) {
    return Object.assign(new SATScore(), rawSATScore);
  }
}

class ACTScore extends Score {
  static MAX_ACT_SCORE = 36;
  static MIN_SAT_SCORE = 1;

  constructor(english, math, reading, science, projected, mock) {
    super("ACT", projected, mock);
    this.english = english;
    this.ACTMath = math;
    this.reading = reading;
    this.science = science;
  }

  getCumulativeScore(numSections) {
    // eslint-disable-next-line max-len
    let scoreSum = this.english + this.ACTMath + this.reading + this.science;
    return Math.round(scoreSum / numSections);
  }


  // eslint-disable-next-line max-lines-per-function
  // eslint-disable-next-line max-statements
  toString() {
    let starProjected = (this.isProjected() ? "*" : "");
    let mock = (this.isMock() ? "MOCK" : "");
    let scoreArray = [];
    let cumulative = "";

    if (this.english) {
      scoreArray.push(`${starProjected}${this.english}E`);
    }

    if (this.ACTMath) {
      scoreArray.push(`${starProjected}${this.ACTMath}M`);
    }

    if (this.reading) {
      scoreArray.push(`${starProjected}${this.reading}R`);
    }

    if (this.science) {
      scoreArray.push(`${starProjected}${this.science}S`);
    }

    if (scoreArray.length === 0) {
      return "No Score";
    }

    if (scoreArray.length === 4) {
      cumulative = `(${starProjected}${this.getCumulativeScore(scoreArray.length)}C)`;
    }

    return `${mock} ${scoreArray.join("/")} ${cumulative}`;
  }

  static makeACTScore(rawACTScore) {
    return Object.assign(new ACTScore(), rawACTScore);
  }
}

module.exports = {SATScore, ACTScore};
