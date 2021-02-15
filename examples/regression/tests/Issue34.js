const { action } = require('../../..')
const assert = require('assert')
const expect = require('expect')
const fs = require('fs')
const glob = require('glob')
const { execFileSync } = require('child_process')

action('Clean the results directory', async () => {
  execFileSync('rm', ['-rf', 'tmp/issue34-allure-results'])
})

action('Run test', async () => {
  execFileSync(
    './bin/prescript',
    [require.resolve('../../calculator/tests/Basic addition (flat).js')],
    {
      env: {
        ...process.env,
        ALLURE_RESULTS_DIR: 'tmp/issue34-allure-results',
        ALLURE_ENV_MEOW: 'meow'
      }
    }
  )
})

action('Generate an allure-report', async () => {
  execFileSync('yarn', [
    'allure',
    'generate',
    '--clean',
    ...['--output', 'tmp/issue34-allure-report'],
    'tmp/issue34-allure-results'
  ])
  assert(fs.existsSync('tmp/issue34-allure-report'), 'Expected report to exist')
})

action('Verify that parameters are logged', async () => {
  const [file] = glob.sync('tmp/issue34-allure-report/data/test-cases/*.json')
  assert(file, 'Expected test case JSON files to exist')
  const testcase = JSON.parse(fs.readFileSync(file))
  expect(testcase.parameters).toEqual([
    { name: 'ALLURE_ENV_MEOW', value: 'meow' }
  ])
})
