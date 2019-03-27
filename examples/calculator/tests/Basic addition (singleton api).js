const { test, action, getCurrentState, getCurrentContext } = require('../../..')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

test('Basic addition', () => {
  action('Initialize the calculator', () => {
    getCurrentState().calculator = new Calculator()
    getCurrentContext().log()
  })
  action('Enter 50 into the calculator', () => {
    getCurrentState().calculator.enter(50)
  })
  action('Enter 70 into the calculator', () => {
    getCurrentState().calculator.enter(70)
  })
  action('Press add', () => {
    getCurrentState().calculator.add()
  })
  action('Stored result must be 120', () => {
    assert.equal(getCurrentState().calculator.result, 120)
  })
})
