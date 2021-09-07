const { action } = require('../../..')
const expect = require('expect')
const fs = require('fs')
const { spawnSync } = require('child_process')

const expectedSequence = `
* createTestReporter: examples/reporters/fixtures/ExampleTestFixture.js, testName=[implicit test]
| * onEnterStep: [implicit test]
| | * onEnterStep: Do something
| | | * onEnterStep: Do this
| | | * onExitStep: Do this, error=undefined
| | | * onEnterStep: Do that
| | | * onExitStep: Do that, error=undefined
| | | * onEnterStep: Do the other thing
| | | | * onEnterStep: Do these
| | | | * onExitStep: Do these, error=undefined
| | | | * onEnterStep: Do those
| | | | * onExitStep: Do those, error=undefined
| | | | * onEnterStep: Do deez dooz
| | | | * onExitStep: Do deez dooz, error=undefined
| | | * onExitStep: Do the other thing, error=undefined
| | * onExitStep: Do something, error=undefined
| | * onEnterStep: This is a passing step
| | * onExitStep: This is a passing step, error=undefined
| | * onEnterStep: This is a failing step
| | * onExitStep: This is a failing step, error=Error: This is a failing step
| * onExitStep: [implicit test], error=undefined
| * onEnterStep: This is a deferred step
| * onExitStep: This is a deferred step, error=undefined
* onFinish: errors.length=1
`.trim()

action('Run test', async () => {
  spawnSync('./bin/prescript', [
    require.resolve('../fixtures/ExampleTestFixture.js')
  ])
})

action('Check generated sequence', async () => {
  const actualSequence = fs
    .readFileSync('tmp/reporter/events.txt', 'utf8')
    .trim()
  expect(actualSequence).toEqual(expectedSequence)
})
