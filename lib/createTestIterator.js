
function createTestIterator () {
  let test
  let stepper

  return {
    setTest (_test) {
      test = _test
    },
    getTest () {
      return test
    },
    begin () {
      stepper = createStepper(test)
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

function createStepper (test) {
  function * generateSteps () {
    yield * walk(test)
    function * walk (node) {
      if (node.action) {
        const ok = yield node
        return ok
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