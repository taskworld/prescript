/* eslint-env jest */
import loadTestModule from './loadTestModule'
import createTestIterator from './createTestIterator'

function load(testModule) {
  return loadTestModule(testModule, { logger: null })[0]
}

describe('a test iterator', () => {
  describe('a simple test', () => {
    const test = load(({ step, action }) => {
      step('Turn on the computer', () => {
        step('Plug the computer in', () => {
          action(() => {})
        })
        step('Press the power button', () => {
          action(() => {})
        })
      })
      step('Write tests', () => {
        action(() => {})
      })
    })
    it('maintains the test state', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      expect(tester.getCurrentStepNumber()).toBe(null)
      tester.begin()
      expect(tester.getCurrentStepNumber()).toBe('1.1')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('1.2')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('2')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
    it('allows starting test at arbitrary point', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      expect(tester.getCurrentStepNumber()).toBe(null)
      tester.begin('2')
      expect(tester.getCurrentStepNumber()).toBe('2')
      tester.begin('1.2')
      expect(tester.getCurrentStepNumber()).toBe('1.2')
      tester.begin('1')
      expect(tester.getCurrentStepNumber()).toBe('1.1')
    })
    it('becomes already done if trying to start at an invalid point', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      tester.begin('9')
      expect(tester.isDone()).toBe(true)
    })
    it('skips other steps if test failed', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      tester.begin()
      expect(tester.getCurrentStepNumber()).toBe('1.1')
      tester.actionFailed(new Error('!!!'))
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
  })

  describe('a test with cleanup step', () => {
    const test = load(({ step, action, cleanup }) => {
      step('Open browser', () => {
        action(() => {})
      })
      step('Do something', () => {
        action(() => {})
      })
      step('Do something else', () => {
        step('Create file', () => {
          action(() => {})
        })
        cleanup('Delete file', () => {
          action(() => {})
        })
      })
      step('Do something more', () => {
        action(() => {})
      })
      cleanup('Close browser', () => {
        action(() => {})
      })
    })
    it('should run the cleanup step in normal run', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      tester.begin()
      expect(tester.getCurrentStepNumber()).toBe('1')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('2')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('3.1')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('3.2')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('4')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe('5')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
    it('should run the cleanup step after failure', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      tester.begin() // 1
      tester.actionPassed() // 2
      tester.actionPassed() // 3.1
      tester.actionFailed(new Error('!!!')) // 3.2 (cleanup)
      tester.actionPassed() // 5
      expect(tester.getCurrentStepNumber()).toBe('5')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
    it('should skip cleanup step in skipped child steps', () => {
      const tester = createTestIterator()
      tester.setTest(test)
      tester.begin() // 1
      tester.actionFailed(new Error('!!!')) // 5
      expect(tester.getCurrentStepNumber()).toBe('5')
      tester.actionPassed()
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
  })

  describe('a test with independent step', () => {
    const test = load(({ to, defer, action, independent }) => {
      action`Arrange`(async () => {})
      defer`Teardown`(async () => {})
      action`Act`(async () => {})
      to`Asserts`(() => {
        independent(() => {
          action`Assert 1`(async () => {})
          action`Assert 2`(async () => {})
          to`Child asserts`(() => {
            action`Assert 3`(async () => {})
            action`Assert 4`(async () => {})
          })
          to`Independent child asserts`(() => {
            independent(() => {
              action`Assert 5`(async () => {})
              action`Assert 6`(async () => {})
            })
          })
        })
      })
      action`Follow up`(async () => {})
    })
    it('should run all assertions normally', () => {
      const sequence = getStepSequence(test)
      expect(sequence).toEqual([
        'Arrange',
        'Act',
        'Assert 1',
        'Assert 2',
        'Assert 3',
        'Assert 4',
        'Assert 5',
        'Assert 6',
        'Follow up',
        'Teardown'
      ])
    })
    it('should keep on running independent assertions', () => {
      const sequence = getStepSequence(test, { failingSteps: ['Assert 1'] })
      expect(sequence).toEqual([
        'Arrange',
        'Act',
        'Assert 1',
        'Assert 2',
        'Assert 3',
        'Assert 4',
        'Assert 5',
        'Assert 6',
        'Teardown'
      ])
    })
    it('should keep independent one level only', () => {
      const sequence = getStepSequence(test, {
        failingSteps: ['Assert 1', 'Assert 3', 'Assert 5']
      })
      expect(sequence).toEqual([
        'Arrange',
        'Act',
        'Assert 1',
        'Assert 2',
        'Assert 3',
        'Assert 5',
        'Assert 6',
        'Teardown'
      ])
    })
  })

  describe('replacing test', () => {
    it('clears the program counter', () => {
      const tester = createTestIterator()
      tester.setTest(
        load(({ step, action }) => {
          step('Step 1', () => {
            action(() => {})
          })
          step('Step 2', () => {
            action(() => {})
          })
          step('Step 3', () => {
            action(() => {})
          })
        })
      )
      tester.begin() // 1
      tester.actionPassed() // 2
      expect(tester.getCurrentStepNumber()).toBe('2')
      tester.setTest(
        load(({ step, action }) => {
          step('Step X', () => {
            action(() => {})
          })
          step('Step Y', () => {
            action(() => {})
          })
          step('Step Z', () => {
            action(() => {})
          })
        })
      )
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
  })
})

function getStepSequence(test, { failingSteps = [] as string[] } = {}) {
  const tester = createTestIterator()
  tester.setTest(test)
  tester.begin()
  const out: string[] = []
  const fail = new Set(failingSteps)
  for (;;) {
    const step = tester.getCurrentStepNumber()
    if (step === null) break
    const name = tester.getCurrentStep().name.toString()
    out.push(name)
    if (fail.has(name)) {
      tester.actionFailed(new Error(`Fail on ${name}`))
    } else {
      tester.actionPassed()
    }
  }
  return out
}
