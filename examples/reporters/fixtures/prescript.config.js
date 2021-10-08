const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/** @type {import('../../..').IConfig} */
module.exports = {
  createTestReporter: (testModulePath, testName) => {
    const events = []
    const relativePath = path.relative(process.cwd(), testModulePath)
    let depth = 0
    const log = text => {
      const prefix = '| '.repeat(depth) + '* '
      events.push(prefix + text)
    }
    log(`createTestReporter: ${relativePath}, testName=${testName}`)
    depth++
    return {
      onEnterStep(step) {
        log(`onEnterStep: ${step.name}`)
        depth++
      },
      onExitStep(step, error) {
        depth--
        log(`onExitStep: ${step.name}, error=${error}`)
      },
      onFinish(errors) {
        depth--
        log(`onFinish: errors.length=${errors.length}`)
        execFileSync('mkdir', ['-p', 'tmp/reporter'])
        fs.writeFileSync('tmp/reporter/events.txt', events.join('\n'))
      }
    }
  }
}
