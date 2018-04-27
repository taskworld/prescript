import path from 'path'

export default function createReporter(testModulePath) {
  if (
    !process.env.ALLURE_SUITE_NAME &&
    !process.env.ALLURE_RESULTS_DIR &&
    !process.env.ALLURE_CASE_NAME
  ) {
    return { onFinish(errors: Error[]) {}, iterationListener: {} }
  }
  const suiteName = process.env.ALLURE_SUITE_NAME || 'prescript'
  const caseName =
    process.env.ALLURE_CASE_NAME || path.relative(process.cwd(), testModulePath)
  const Allure = require('allure-js-commons')
  const allure = new Allure()
  if (process.env.ALLURE_RESULTS_DIR) {
    allure.options.targetDir = process.env.ALLURE_RESULTS_DIR
  }
  allure.startSuite(suiteName)
  allure.startCase(caseName)
  return {
    iterationListener: {
      onEnter(node) {
        if (node.number) allure.startStep(String(node.name), Date.now())
      },
      onExit(node, error) {
        if (node.number) allure.endStep(error ? 'failed' : 'passed', Date.now())
      }
    },
    onFinish(errors: Error[]) {
      if (errors.length) {
        const error = errors[0]
        if ((error as any).__prescriptPending) {
          allure.endCase('pending')
        } else {
          allure.endCase('failed', error)
        }
      } else {
        allure.endCase('passed')
      }
      allure.endSuite()
    }
  }
}
