const loadTestModule = require('./lib/loadTestModule')
const chalk = require('chalk')
const isPreviousStepFailedError = Symbol('isPreviousStepFailedError')
const isChildStepFailedError = Symbol('isChildStepFailedError')
const args = require('minimist')(process.argv.slice(2))

function runTest (test) {
  const state = { }
  const runStep = (steps, index) => (error) => {
    if (index >= steps.length) {
      if (error) throw error
      return
    }
    const step = steps[index]
    const next = runStep(steps, index + 1)
    const runStepContents = () => {
      console.log('* ' + step.number + '. ' + step.name)
      if (step.action) return Promise.resolve(step.action(state))
      if (step.children) {
        return Promise.resolve(runStep(step.children, 0)(null)).catch((error) => {
          const e = new Error('Child steps failed: ' + error)
          e[isChildStepFailedError] = true
          throw e
        })
      }
      return Promise.reject(new Error('Invalid state - no action nor children'))
    }
    const getPromise = () => {
      if (error) {
        const e = new Error('Previous tests failed')
        e[isPreviousStepFailedError] = true
        return step.cleanup ? runStepContents().then(() => Promise.reject(e)) : Promise.reject(e)
      }
      return runStepContents()
    }
    return getPromise().then(
      () => next(null),
      (error) => {
        if (!error[isPreviousStepFailedError] && !error[isChildStepFailedError]) {
          console.error(chalk.bold.red('Step ' + step.number + ' failed'))
          console.error(chalk.red(error.stack))
        }
        return next(error)
      }
    )
  }
  return runStep(test.children, 0)(null)
}

const testModulePath = require('fs').realpathSync(args._[0])
const testModule = require(testModulePath)

console.log(chalk.bold.magenta('# prescript'), 'v' + require('./package').version)
console.log()
console.log(chalk.bold.yellow('## Generating test plan...'))
const test = loadTestModule(testModule)
console.log(chalk.dim('* ') + chalk.green('Test plan generated successfully.'))
console.log()

const dev = args.d || args['dev']

if (dev) {
  const vorpal = require('vorpal')()
  vorpal.command('run').action(function (args, callback) {
    runTest(test).then(() => callback(), (err) => callback(err))
  })
  vorpal.delimiter('prescript>').show()
} else {
  console.log(chalk.bold.yellow('## Running tests...'))
  runTest(test).catch((e) => setTimeout(() => { throw e }))
}
