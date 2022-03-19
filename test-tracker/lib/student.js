const nextId = require("./next-id");
const Test = require("./test");


class Student {
  constructor(name, testPlan, baseline) {
    this.id = nextId();
    this.name = name;
    this.testPlan = testPlan;
    this.createFirstPack(testPlan);
    this.baseline = baseline;
  }

  setTestPlan(plan) {
    this.testPlan = plan;
  }

  createFirstPack(plan) {
    let testPacks = Test.PACK_ORDER[plan];
    let firstPack = testPacks[0];

    this.tests = [];
    this.addTestPack(firstPack);
  }

  addTestPack(packName) {
    let testList = Test.PACKS[packName];

    testList.forEach(testName => {
      this.tests.push(new Test(testName, packName));
    });

    this.currentTestPack = packName;
  }

  removeTestPack(packName) {
    let testList = Test.PACKS[packName];

    testList.forEach(testName => {
      this.tests.splice(this.tests.indexOf(testName), 1);
    });
    this.currentTestPack = this.last().testPack;
  }

  add(test) {
    if (!(test instanceof Test)) {
      throw new TypeError("can only add Test objects");
    }

    this.tests.push(test);
  }

  mostRecentCompleted() {
    return this.allDone().sort((testA, testB) => {
      return testB.dateTaken - testA.dateTaken;
    })[0];
  }

  size() {
    return this.tests.length;
  }

  first() {
    return this.tests[0];
  }

  last() {
    return this.tests[this.size() - 1];
  }

  itemAt(index) {
    this._validateIndex(index);
    return this.tests[index];
  }

  markDoneAt(index) {
    this.itemAt(index).markDone();
  }

  markUndoneAt(index) {
    this.itemAt(index).markUndone();
  }

  isDone() {
    return this.size() > 0 && this.tests.every(test => test.isDone());
  }

  shift() {
    return this.tests.shift();
  }

  pop() {
    return this.tests.pop();
  }

  removeAt(index) {
    this._validateIndex(index);
    return this.tests.splice(index, 1);
  }

  toString() {
    let name = `---- ${this.name} ----`;
    let testList = this.tests.map(test => test.toString()).join("\n");
    return `${name}\n${testList}`;
  }

  forEach(callback) {
    this.tests.forEach(test => callback(test));
  }

  filter(callback) {
    let newStudent = new Student(this.name, this.testPlan, this.baseline);
    this.tests.forEach(test => {
      if (callback(test)) {
        newStudent.add(test);
      }
    });

    return newStudent;
  }

  findByName(name) {
    return this.tests.filter(test => test.name === name).first();
  }

  findById(id) {
    return this.tests.filter(test => test.id === id).first();
  }

  findIndexOf(testToFind) {
    let findId = testToFind.id;
    return this.tests.findIndex(test => test.id === findId);
  }

  allDone() {
    return this.tests.filter(test => test.isDone());
  }

  allNotDone() {
    return this.tests.filter(test => !test.isDone());
  }

  allTests() {
    return this.tests.filter(_ => true);
  }

  markDone(name) {
    let test = this.findByName(name);
    if (test !== undefined) {
      test.markDone();
    }
  }

  markAllDone() {
    this.tests.forEach(test => test.markDone());
  }

  markAllUndone() {
    this.tests.forEach(test => test.markUndone());
  }

  toArray() {
    return this.tests.slice();
  }

  setName(name) {
    this.name = name;
  }

  setBaseline(baseline) {
    this.baseline = baseline;
  }

  logBaseline() {
    if (Array.isArray(this.baseline)) {
      let scoreSum = this.baseline.reduce((acc, val) => acc + val);
      if (this.baseline.length === 2) {
        let cumulative = scoreSum;
        return `Baseline: ${this.baseline[0]}V/${this.baseline[1]}M (${cumulative}C)`;
      } else if (this.baseline.length === 4) {
        let cumulative = Math.round(scoreSum / this.baseline.length);
        return `Baseline: ${this.baseline[0]}E/${this.baseline[1]}M/${this.baseline[2]}R/${this.baseline[3]}S (${cumulative}C)`;
      }
    }
    return `No Baseline`;
  }

  static makeStudent(rawStudent) {
    // eslint-disable-next-line max-len
    let student = Object.assign(new Student(rawStudent.name, rawStudent.testPlan, rawStudent.baseline), {
      id: rawStudent.id,
      // name: rawStudent.name,
      // baseline: rawStudent.baseline,
      tests: [],
      currentTestPack: rawStudent.currentTestPack,
      // testPlan: rawStudent.testPlan,
    });
    if (rawStudent.tests) {
      rawStudent.tests.forEach(test => student.add(Test.makeTest(test)));
    }

    return student;
  }

  _validateIndex(index) { // _ in name indicates "private" method
    if (!(index in this.tests)) {
      throw new ReferenceError(`invalid index: ${index}`);
    }
  }
}

module.exports = Student;
