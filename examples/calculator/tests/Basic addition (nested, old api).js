const { step, action } = require('../../..')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

step('Initialize the calculator', () => {
  action(state => {
    state.calculator = new Calculator()
  })
})
step('Calculate 50 + 70', () => {
  step('Enter 50 into the calculator', () => {
    action(state => {
      state.calculator.enter(50)
    })
  })
  step('Enter 70 into the calculator', () => {
    action(state => {
      state.calculator.enter(70)
    })
  })
  step('Press add', () => {
    action(state => {
      state.calculator.add()
    })
  })
})
step('Stored result must be 120', () => {
  action(state => {
    assert.equal(state.calculator.result, 120)
  })
})
