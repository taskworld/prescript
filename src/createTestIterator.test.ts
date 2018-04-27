/* eslint-env jest */
import loadTestModule from './loadTestModule'
import createTestIterator from './createTestIterator'

function load (testModule) {
  return loadTestModule(testModule, { logger: null })[0]
}

describe('a test iterator', () => {
  describe('a simple test', () => {
    const test = load(({ step, action }) => {
      step('Turn on the computer', () => {
        step('Plug the computer in', () => {
          action(() => { })
        })
        step('Press the power button', () => {
          action(() => { })
        })
      })
      step('Write tests', () => {
        action(() => { })
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
        action(() => { })
      })
      step('Do something', () => {
        action(() => { })
      })
      step('Do something else', () => {
        step('Create file', () => {
          action(() => { })
        })
        cleanup('Delete file', () => {
          action(() => { })
        })
      })
      step('Do something more', () => {
        action(() => { })
      })
      cleanup('Close browser', () => {
        action(() => { })
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

  describe('replacing test', () => {
    it('clears the program counter', () => {
      const tester = createTestIterator()
      tester.setTest(load(({ step, action }) => {
        step('Step 1', () => { action(() => { }) })
        step('Step 2', () => { action(() => { }) })
        step('Step 3', () => { action(() => { }) })
      }))
      tester.begin() // 1
      tester.actionPassed() // 2
      expect(tester.getCurrentStepNumber()).toBe('2')
      tester.setTest(load(({ step, action }) => {
        step('Step X', () => { action(() => { }) })
        step('Step Y', () => { action(() => { }) })
        step('Step Z', () => { action(() => { }) })
      }))
      expect(tester.getCurrentStepNumber()).toBe(null)
    })
  })
})
