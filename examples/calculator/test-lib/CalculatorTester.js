const { to, action, named } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = function CalculatorTester() {
  action('Initialize the calculator', state => {
    state.calculator = new Calculator()
  })
  const calculatorTester = {
    add(a, b) {
      to(named`Calculate ${a} + ${b}`, () => {
        enter(a)
        enter(b)
        pressAdd()
      })
      return calculatorTester
    },
    resultMustBe(n) {
      action(named`Stored result must be ${n}`, state => {
        assert.equal(state.calculator.result, n)
      })
    }
  }
  function enter(number) {
    action(named`Enter ${number} into the calculator`, state => {
      state.calculator.enter(number)
    })
  }
  function pressAdd() {
    action('Press add', state => {
      state.calculator.add()
    })
  }
  return calculatorTester
}
