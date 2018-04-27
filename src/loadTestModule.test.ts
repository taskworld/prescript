/* eslint-env jest */
import loadTestModule from './loadTestModule'
import walkSteps from './walkSteps'
import { IStep } from './types';

function load (testModule) {
  return loadTestModule(testModule, { logger: null })
}

describe('a test module', () => {
  it('can be empty', () => {
    const tests = load(({ step, test }) => {
      test('Meow', () => { })
    })
    expect(tests[0].children!.length).toBe(0)
  })

  it('can have steps and actions', () => {
    const tests = load(({ step, action }) => {
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
    expect(numberedDescriptionsOf(tests[0])).toEqual([
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

function numberedDescriptionsOf (root: IStep) {
  const out: string[] = [ ]
  walkSteps(root, (step) => {
    out.push(`${step.number}. ${step.name}`)
  })
  return out
}
