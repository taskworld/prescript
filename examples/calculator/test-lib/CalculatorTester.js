const { to, action, named } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = class CalculatorTester {
  constructor() {
    action('Initialize the calculator', state => {
      state.calculator = new Calculator()
    })
  }

  /**
   * Creates a step that makes the calculator add `a` and `b` together.
   * @param {number} a
   * @param {number} b
   */
  add(a, b) {
    to`Calculate ${a} + ${b}`(() => {
      this.enter(a)
        .enter(b)
        .pressAdd()
    })
    return this
  }

  /**
   * Creates a step that asserts the state of the calculator.
   * @param {number} n
   */
  resultMustBe(n) {
    action`Stored result must be ${n}`(state => {
      assert.equal(state.calculator.result, n)
    })
    return this
  }

  /**
   * Creates a step that enters a number into the calculator.
   * @param {number} number
   */
  enter(number) {
    action`Enter ${number} into the calculator`(state => {
      state.calculator.enter(number)
    })
    return this
  }

  /**
   * Creates a step that presses the add button on the calculator.
   * @param {number} number
   */
  pressAdd() {
    action('Press add', state => {
      state.calculator.add()
    })
    return this
  }
}
