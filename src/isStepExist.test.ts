/* eslint-env jest */
import loadTestModule from './loadTestModule'
import isStepExist from './isStepExist'

function load (testModule) {
  return loadTestModule(testModule, { logger: null })
}

describe('isStepExist', () => {
  const tests = load(({ step, action }) => {
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
    expect(isStepExist(tests[0], '1.1')).toEqual(true)
  })
  it('should be able to determined if steps not exists', () => {
    expect(isStepExist(tests[0], '1.2')).toEqual(false)
  })
})
