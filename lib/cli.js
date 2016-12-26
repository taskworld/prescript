const co = require('co')
const ms = require('ms')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const indentString = require('indent-string')

const createTestIterator = require('./createTestIterator')
const walkSteps = require('./walkSteps')
const prettyFormatStep = require('./prettyFormatStep')
const singleton = require('./singleton')

function runDevelopmentMode (testModulePath) {
  const state = { }
  const tester = createTestIterator(createLogVisitor())
  let previousResult

  function loadTest () {
    console.log(chalk.bold.yellow('## Loading test and generating test plan...'))
    try {
      const test = singleton.loadTest(() => { require(testModulePath) })
      tester.setTest(test)
      console.log(chalk.dim('* ') + chalk.green('Test plan generated successfully.'))
      console.log()
    } catch (e) {
      console.log(chalk.bold.red('Cannot load the test file.'))
      console.log(chalk.red(e.stack))
      console.log()
    }
  }

  function clearModuleCache () {
    const keysToRemove = Object.keys(require.cache).filter(shouldRemove)
    console.log(chalk.bold.yellow('## Clearing Node module cache...'))
    for (const key of keysToRemove) {
      console.log(chalk.dim('*'), 'Reloading', chalk.cyan(key))
      delete require.cache[key]
    }
    console.log()

    function shouldRemove (filePath) {
      const components = filePath.split(path.sep)
      return !components.includes('node_modules') &&
        !path.relative(process.cwd(), filePath).startsWith('..')
    }
  }

  loadTest()
  tester.begin()

  console.log(chalk.bold.yellow('## Entering development mode...'))
  console.log('Welcome to prescript development mode.')
  console.log()
  announceStatus()
  hint('help', 'for more information')
  console.log()

  const vorpal = require('vorpal')()

  vorpal.command('inspect')
  .alias('i')
  .description('Inspect the test state')
  .action(function (args, callback) {
    console.log('This is current test state:')
    console.log(util.inspect(state))
    console.log()
    callback()
  })

  vorpal.command('status')
  .alias('s')
  .description('Show the test status')
  .action(function (args, callback) {
    console.log('This is the test plan with current test status:')
    const currentStepNumber = tester.getCurrentStepNumber()
    let printed = false
    walkSteps(tester.getTest(), (step) => {
      const prefix = (step.number === currentStepNumber
        ? chalk.bold.blue('次は')
        : (previousResult && step.number === previousResult.stepNumber
          ? (previousResult.error
            ? chalk.bold.bgRed(' NG ')
            : chalk.bold.bgGreen(' OK ')
          )
          : '    '
        )
      )
      printed = true
      console.log(prefix, prettyFormatStep(step))
    })
    if (!printed) {
      console.log(chalk.yellow('The test plan is empty.'))
    }
    console.log()
    announceStatus()
    console.log()
    callback()
  })

  vorpal.command('reload')
  .alias('r')
  .description('Reload the test file')
  .action(function (args, callback) {
    clearModuleCache()
    loadTest()
    console.log('Test file is reloaded.')
    if (previousResult) {
      tester.begin(previousResult.stepNumber)
      const next = tester.getCurrentStepNumber()
      if (next) {
        console.log('Jumping to', prettyFormatStep(tester.getCurrentStep()))
      } else {
        console.log('Cannot jump to previously run step ' + next)
      }
    } else {
      tester.begin()
    }
    console.log()
    announceStatus()
    console.log()
    callback()
  })

  let canceled = false
  vorpal.command('continue')
  .alias('c')
  .description('Continue running the test until there is an error')
  .action(function (args, callback) {
    handleRun(co(function * () {
      while (!tester.isDone()) {
        if (yield * nextStep()) break
        if (canceled) {
          console.log(chalk.yellow('Interrupted by user.'))
          canceled = false
          break
        }
      }
    }), callback)
  })
  .cancel(() => { canceled = true })

  vorpal.command('next')
  .alias('n')
  .description('Run the next step.')
  .action(function (args, callback) {
    handleRun(co(nextStep), callback)
  })

  vorpal.command('jump <stepNumber>')
  .alias('j')
  .description('Jump to a step number')
  .action(function (args, callback) {
    tester.begin(String(args.stepNumber))
    previousResult = null
    announceStatus()
    console.log()
    callback()
  })

  vorpal.command('runto <stepNumber>')
  .description('Run from current step to step number')
  .action(function (args, callback) {
    handleRun(co(function* () {
      while (!(tester.getCurrentStepNumber() === String(args.stepNumber) || tester.isDone())) {
        if (yield * nextStep()) break
        if (canceled) {
          console.log(chalk.yellow('Interrupted by user.'))
          canceled = false
          break
        }
      }
    }), callback)
  })

  vorpal.delimiter('prescript>').show()

  function handleRun (promise, callback) {
    promise.then(
      () => {
        announcePrevious()
        announceStatus()
        console.log()
        callback()
      },
      (err) => {
        callback(err)
      }
    )
  }

  function * nextStep () {
    let error
    const stepNumber = tester.getCurrentStepNumber()
    yield * runNext(tester, state, (e) => { error = e })
    previousResult = { stepNumber, error }
    return error
  }

  function announcePrevious () {
    if (previousResult) {
      if (previousResult.error) {
        console.log(chalk.bold.red('Step ' + previousResult.stepNumber + ' encountered an error'))
      }
    }
  }

  function announceStatus () {
    const current = tester.getCurrentStepNumber()
    if (previousResult && previousResult.error) {
      hint('reload', 'after fixing the test to reload the test file')
    }
    if (current) {
      console.log(
        chalk.bold.blue('次は'),
        prettyFormatStep(tester.getCurrentStep())
      )
      hint('next', 'to run this step only')
      hint('continue', 'to run from this step until next error')
      hint('runto', 'to run into specific step')
    } else {
      console.log(chalk.yellow('Nothing to be run.'))
      hint('status', 'to see the test plan')
      hint('jump', 'to jump to a step number')
    }
  }

  function hint (commandName, description) {
    console.log('Type', chalk.cyan(commandName), description)
  }
}

function runNonInteractiveMode (testModulePath) {
  console.log(chalk.bold.yellow('## Generating test plan...'))
  const test = singleton.loadTest(() => {
    require(testModulePath)
  })
  console.log(chalk.dim('* ') + chalk.green('Test plan generated successfully.'))
  console.log()

  console.log(chalk.bold.yellow('## Running tests...'))
  runTest().catch((e) => setTimeout(() => { throw e }))

  function runTest () {
    return co(function * () {
      const state = { }
      const tester = createTestIterator(createLogVisitor())
      const errors = [ ]
      const started = Date.now()
      tester.setTest(test)
      tester.begin()
      while (!tester.isDone()) {
        yield * runNext(tester, state, (e) => errors.push(e))
      }
      const timeTaken = Date.now() - started
      const formattedTimeTaken = chalk.dim(ms(timeTaken))
      if (errors.length) {
        if (errors.every(e => e.__prescriptPending)) {
          console.log(chalk.bold.yellow('Test pending'), formattedTimeTaken)
          process.exit(2)
        } else {
          console.log(chalk.bold.red('Test failed'), formattedTimeTaken)
          process.exit(1)
        }
      } else {
        console.log(chalk.bold.green('すばらしい!'), formattedTimeTaken)
      }
    })
  }
}

function createLogVisitor () {
  return {
    visitNode (node) {
      if (node.children) {
        console.log(chalk.dim('Step'), prettyFormatStep(node))
      }
    }
  }
}

function * runNext (tester, state, onError) {
  const step = tester.getCurrentStep()
  const indent = 7 + step.number.length

  process.stdout.write(
    chalk.dim('Step ') +
    indentString(prettyFormatStep(step), indent).substr(indent) +
    '...'
  )
  const started = Date.now()
  const formatTimeTaken = () => chalk.dim(ms(Date.now() - started))
  const log = [ ]
  const context = {
    log: (...args) => {
      log.push(util.format(...args))
    }
  }
  try {
    const promise = step.action(state, context)
    if (
      (promise && typeof promise.then !== 'function') ||
      (!promise && promise !== undefined)
    ) {
      throw new Error('An action should return a Promise (async) or undefined (sync).')
    }
    yield Promise.resolve(promise)
    console.log('\b\b\b', chalk.bold.green('OK'), formatTimeTaken())
    showLog()
    tester.actionPassed()
  } catch (e) {
    console.log('\b\b\b', chalk.bold.red('NG'), formatTimeTaken())
    console.log(chalk.red(indentString(e.stack, indent)))
    console.log(chalk.red(indentString('Action defined\n    at ' + step.actionDefinition, indent)))
    showLog()
    onError(e)
    tester.actionFailed()
  }

  function showLog () {
    for (const item of log) {
      const logText = chalk.dim('* ') + chalk.cyan(indentString(item, 2).substr(2))
      console.log(indentString(logText, indent))
    }
  }
}

function main (args) {
  const testModulePath = require('fs').realpathSync(args._[0])
  console.log(chalk.bold.magenta('# prescript'), 'v' + require('../package').version)
  console.log()

  const dev = args.d || args['dev']
  if (dev) {
    runDevelopmentMode(testModulePath)
  } else {
    runNonInteractiveMode(testModulePath)
  }
}

module.exports = main
