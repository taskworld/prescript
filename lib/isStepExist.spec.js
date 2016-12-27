/* eslint-env jest */
const loadTestModule = require('./loadTestModule')
const isStepExist = require('./isStepExist')

function load (testModule) {
  return loadTestModule(testModule, { logger: false })
}

describe('isStepExist', () => {
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
    expect(isStepExist(test, '1.1')).toEqual(true)
  })
  it('should be able to determined if steps not exists', () => {
    expect(isStepExist(test, '1.2')).toEqual(false)
  })
})
