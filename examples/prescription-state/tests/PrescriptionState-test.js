const { test, action, getCurrentPrescriptionState } = require('../../..')
const assert = require('assert')

test('getCurrentPrescriptionState', () => {
  foo().check(1)
  foo().check(2)
  foo().check(3)
  foo().check(4)
})

function foo() {
  const prescriptionState = getCurrentPrescriptionState()
  const counter = (prescriptionState.counter =
    1 + (prescriptionState.counter || 0))
  return {
    check(value) {
      action`Prescribed counter (${counter}) should equal ${value}`(
        async () => {
          assert.equal(counter, value)
        }
      )
    }
  }
}
