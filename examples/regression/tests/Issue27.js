const { action } = require('../../..')
const assert = require('assert')
const fs = require('fs')
const glob = require('glob')
const { execFileSync } = require('child_process')

action('Run test (it should fail)', async () => {
  let failed = false
  execFileSync('rm', ['-rf', 'tmp/issue27-allure-results'])
  try {
    execFileSync(
      './bin/prescript',
      [require.resolve('../fixtures/Issue27-AnsiColorTestFixture.js')],
      {
        env: {
          ...process.env,
          ALLURE_RESULTS_DIR: 'tmp/issue27-allure-results',
          ALLURE_SUITE_NAME: 'prescript-regression-issue27',
          FORCE_COLOR: '1'
        }
      }
    )
  } catch (error) {
    failed = true
  }
  assert(failed, 'Expected prescript command to fail')
})

action('Verify that there are JSON allure results generated', async () => {
  const files = glob.sync('*.json', { cwd: 'tmp/issue27-allure-results' })
  assert(files.length > 0, 'Expected to file JSON files')
})

action('Generate an allure-report', async () => {
  execFileSync('yarn', [
    'allure',
    'generate',
    '--clean',
    ...['--output', 'tmp/issue27-allure-report'],
    'tmp/issue27-allure-results'
  ])
  assert(fs.existsSync('tmp/issue27-allure-report'), 'Expected report to exist')
})

action('Verify that there is a test case file', async () => {
  const files = glob.sync('*.json', {
    cwd: 'tmp/issue27-allure-report/data/test-cases'
  })
  assert(files.length > 0, 'Expected test case JSON files to exist')
})
