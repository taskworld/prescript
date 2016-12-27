/* eslint-env jest */
const loadTestModule = require('./loadTestModule')
const StepTraverseUtils = require('./stepsTraverseUtils')

function load (testModule) {
  return loadTestModule(testModule, { logger: false })
}

describe('isStepExists', () => {
  const test = load(({ step, action }) => {
    step('Step 1', () => {
      step('step 1.1', () => {
        action(() => { })
      })
    })
    step('step 2', () => {
      step('step 2.1', () => {
        action(() => { })
      })
    })
  })
  it('should be able to determined if steps exists', () => {
    expect(StepTraverseUtils.isStepExists(test, '1.1')).toEqual(true)
  })
  it('should be able to determined if steps not exists', () => {
    expect(StepTraverseUtils.isStepExists(test, '1.2')).toEqual(false)
  })
})
