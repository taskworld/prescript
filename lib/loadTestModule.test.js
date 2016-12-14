/* eslint-env jasmine */
const loadTestModule = require('./loadTestModule')
const walkSteps = require('./walkSteps')

function load (testModule) {
  return loadTestModule(testModule, { logger: false })
}

describe('a test module', () => {
  it('can be empty', () => {
    const test = load(({ step }) => { })
    expect(test.children.length).toBe(0)
  })

  it('can have steps and actions', () => {
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
    expect(numberedDescriptionsOf(test)).toEqual([
      '1. Turn on the computer',
      '1.1. Plug the computer in',
      '1.2. Press the power button',
      '2. Write tests'
    ])
  })

  it('cannot have an empty step', () => {
    expect(() => {
      load(({ step }) => {
        step('Step A', () => {
        })
      })
    })
    .toThrowError(/empty step/)
  })
})

function numberedDescriptionsOf (root) {
  const out = [ ]
  walkSteps(root, (step) => {
    out.push(`${step.number}. ${step.name}`)
  })
  return out
}
