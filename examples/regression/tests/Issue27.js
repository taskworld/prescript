const { action } = require('../../..')
const assert = require('assert')

action('Run test (it should fail)', async () => {
  let failed = false
  require('child_process').execFileSync('rm', [
    '-rf',
    'tmp/issue27-allure-results'
  ])
  try {
    require('child_process').execFileSync(
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
  assert(failed)
})
