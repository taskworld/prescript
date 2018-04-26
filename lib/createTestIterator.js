
function createTestIterator (visitor, iterationListener) {
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
      stepper = createStepper(test, beginningStep, visitor, iterationListener)
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
    actionFailed (error) {
      stepper.actionFailed(error)
    }
  }
}

function createStepper (test, beginningStep, visitor, iterationListener = { }) {
  function * generateSteps () {
    let found = !beginningStep
    const deferredSteps = []
    yield * walk(test)
    for (const step of deferredSteps) {
      yield * walk(step)
    }
    function * walk (node) {
      if (!found && node.number === beginningStep) {
        found = true
      }
      if (found && visitor && visitor.visitNode && node.number) {
        visitor.visitNode(node)
      }
      if (iterationListener.onEnter) {
        iterationListener.onEnter(node)
      }
      if (node.action) {
        if (found) {
          const { ok, error } = yield node
          if (iterationListener.onExit) {
            iterationListener.onExit(node, error)
          }
          return ok
        } else {
          return true
        }
      } else if (node.children) {
        let stillOk = true
        for (const child of node.children) {
          if (child.defer && stillOk) {
            if (visitor && visitor.visitDeferNode && child.number) {
              visitor.visitDeferNode(child)
            }
            deferredSteps.push(child)
          } else if (child.cleanup || stillOk) {
            stillOk = (yield * walk(child)) && stillOk
          }
        }
        if (iterationListener.onExit) {
          iterationListener.onExit(node)
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
      currentState = iterator.next({ ok: true })
    },
    actionFailed (error) {
      currentState = iterator.next({ ok: false, error })
    }
  }
}

module.exports = createTestIterator
