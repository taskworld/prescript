const { step, action } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = function CalculatorTester () {
  step('Initialize the calculator', () => {
    action((state) => { state.calculator = new Calculator() })
  })
  const calculatorTester = {
    add (a, b) {
      step(`Calculate ${a} + ${b}`, () => {
        enter(a)
        enter(b)
        pressAdd()
      })
      return calculatorTester
    },
    resultMustBe (n) {
      step(`Stored result must be ${n}`, () => {
        action((state) => { assert.equal(state.calculator.result, n) })
      })
    }
  }
  function enter (number) {
    step(`Enter ${number} into the calculator`, () => {
      action((state) => { state.calculator.enter(number) })
    })
  }
  function pressAdd () {
    step('Press add', () => {
      action((state) => { state.calculator.add() })
    })
  }
  return calculatorTester
}
