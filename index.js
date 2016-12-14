const loadTestModule = require('./lib/loadTestModule')
const chalk = require('chalk')
const co = require('co')
const isPreviousStepFailedError = Symbol('isPreviousStepFailedError')
const isChildStepFailedError = Symbol('isChildStepFailedError')
const args = require('minimist')(process.argv.slice(2))
const createTestIterator = require('./lib/createTestIterator')

const testModulePath = require('fs').realpathSync(args._[0])
const testModule = require(testModulePath)

console.log(chalk.bold.magenta('# prescript'), 'v' + require('./package').version)
console.log()
console.log(chalk.bold.yellow('## Generating test plan...'))
const test = loadTestModule(testModule)
console.log(chalk.dim('* ') + chalk.green('Test plan generated successfully.'))
console.log()

const dev = args.d || args['dev']

function runTest (test) {
  return co(function * () {
    const state = { }
    const tester = createTestIterator()
    const errors = [ ]
    tester.setTest(test)
    tester.begin()
    while (!tester.isDone()) {
      const step = tester.getCurrentStep()
      process.stdout.write(
        chalk.dim('* ') +
        chalk.bold(step.number + '. ') +
        step.name +
        '...'
      )
      try {
        yield step.action(state)
        console.log(chalk.bold.green(' OK'))
        tester.actionPassed()
      } catch (e) {
        console.log(chalk.bold.red(' ERROR'))
        console.log(chalk.red(e.stack))
        errors.push(e)
        tester.actionFailed()
      }
    }
    if (errors.length > 0) {
      throw new Error('Test failed.')
    }
  })
}

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
