
function createTestIterator () {
  let test = { children: [ ], name: '(not loaded)' }
  let stepper

  return {
    setTest (_test) {
      test = _test
      stepper = null
    },
    getTest () {
      return test
    },
    begin (beginningStep) {
      stepper = createStepper(test, beginningStep)
    },
    getCurrentStepNumber () {
      if (!stepper) return null
      if (stepper.isDone()) return null
      return stepper.getCurrentStep().number
    },
    getCurrentStep () {
      if (!stepper) throw new Error('Test not started.')
      if (stepper.isDone()) throw new Error('Test already finished.')
      return stepper.getCurrentStep()
    },
    isDone () {
      if (!stepper) return false
      return stepper.isDone()
    },
    actionPassed () {
      stepper.actionPassed()
    },
    actionFailed () {
      stepper.actionFailed()
    }
  }
}

function createStepper (test, beginningStep) {
  function * generateSteps () {
    let found = !beginningStep
    yield * walk(test)
    function * walk (node) {
      if (!found && node.number === beginningStep) {
        found = true
      }
      if (node.action) {
        if (found) {
          const ok = yield node
          return ok
        } else {
          return true
        }
      } else if (node.children) {
        let stillOk = true
        for (const child of node.children) {
          if (child.cleanup) {
            stillOk = (yield * walk(child)) && stillOk
          } else {
            stillOk = stillOk && (yield * walk(child))
          }
        }
        return stillOk
      }
    }
  }
  const iterator = generateSteps()
  let currentState = iterator.next()
  return {
    isDone () {
      return currentState.done
    },
    getCurrentStep () {
      return currentState.value
    },
    actionPassed () {
      currentState = iterator.next(true)
    },
    actionFailed () {
      currentState = iterator.next(false)
    }
  }
}

module.exports = createTestIterator
