const { test, to, action } = require('../../..')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

test('Basic addition', () => {
  action('Initialize the calculator', (state) => {
    state.calculator = new Calculator()
  })
  to('Calculate 50 + 70', () => {
    action('Enter 50 into the calculator', (state) => {
      state.calculator.enter(50)
    })
    action('Enter 70 into the calculator', (state) => {
      state.calculator.enter(70)
    })
    action('Press add', (state) => {
      state.calculator.add()
    })
  })
  action('Stored result must be 120', (state) => {
    assert.equal(state.calculator.result, 120)
  })
})
