const ms = require('ms')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const indentString = require('indent-string')

const createUI = require('./createUI')
const singleton = require('./singleton')
const walkSteps = require('./walkSteps')
const isStepExist = require('./isStepExist')
const createReporter = require('./createReporter')
const prettyFormatStep = require('./prettyFormatStep')
const createTestIterator = require('./createTestIterator')

function runDevelopmentMode (testModulePath) {
  const state = { }
  const tester = createTestIterator(createLogVisitor())
  const ui = createUI()
  let previousResult

  function loadTest () {
    ui.testLoadStarted()
    try {
      const test = singleton.loadTest(() => { require(testModulePath) })
      tester.setTest(test)
      ui.testLoadCompleted(test)
    } catch (e) {
      ui.testLoadError(e)
    }
  }

  function clearModuleCache () {
    const keysToRemove = Object.keys(require.cache).filter(shouldRemove)
    ui.moduleUncacheStarted()
    for (const key of keysToRemove) {
      delete require.cache[key]
      ui.moduleUncached(key)
    }

    function shouldRemove (filePath) {
      const components = filePath.split(path.sep)
      return !components.includes('node_modules') &&
        !path.relative(process.cwd(), filePath).startsWith('..')
    }
  }

  loadTest()
  tester.begin()
  let canceled = false

  ui.developmentModeStarted({
    tester,
    getState () {
      return state
    },
    getCurrentStepNumber () {
      return tester.getCurrentStepNumber()
    },
    getCurrentStep () {
      return tester.getCurrentStep()
    },
    getPreviousResult () {
      return previousResult
    },
    forEachStep (callback) {
      walkSteps(tester.getTest(), callback)
    },
    reload () {
      clearModuleCache()
      loadTest()
      const reloadResult = { }
      if (previousResult) {
        const jumpTarget = previousResult.stepNumber
        tester.begin(jumpTarget)
        const next = tester.getCurrentStepNumber()
        reloadResult.jump = {
          target: jumpTarget,
          success: !!next
        }
      } else {
        tester.begin()
      }
      return reloadResult
    },
    continue () {
      return runTestWhileConditionMet()
    },
    nextStep () {
      return runNextStep()
    },
    jumpTo (stepNumber) {
      tester.begin(stepNumber)
      previousResult = null
    },
    async runTo (stepNumber) {
      if (!isStepExist(tester.getTest(), stepNumber)) {
        console.log(chalk.red('Error: step number is not exists in test'))
        return
      }
      const matchCondition = () => {
        const currentStep = tester.getCurrentStepNumber()
        const targetStep = stepNumber
        return `${currentStep}.`.startsWith(`${targetStep}.`)
      }
      await runTestWhileConditionMet(() => !matchCondition())
    },
    cancel () {
      canceled = true
    }
  })

  async function runTestWhileConditionMet (condition) {
    const executeCondition = () => typeof condition === 'function' ? condition() : true
    while (executeCondition() && !tester.isDone()) {
      if (await runNextStep()) break
      if (canceled) {
        ui.onUserInterrupted()
        canceled = false
        break
      }
    }
  }

  async function runNextStep () {
    let error
    const stepNumber = tester.getCurrentStepNumber()
    await runNext(tester, state, (e) => { error = e })
    previousResult = { stepNumber, error }
    return error
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

  async function runTest () {
    const state = { }
    const reporter = createReporter(testModulePath)
    const tester = createTestIterator(createLogVisitor(), reporter.iterationListener)
    const errors = [ ]
    const started = Date.now()
    tester.setTest(test)
    tester.begin()
    while (!tester.isDone()) {
      await runNext(tester, state, (e) => errors.push(e))
    }
    reporter.onFinish(errors)
    const timeTaken = Date.now() - started
    const formattedTimeTaken = chalk.dim(ms(timeTaken))
    if (errors.length) {
      if (errors.every(e => e.__prescriptPending)) {
        console.log(chalk.bold.yellow('Test pending'), formattedTimeTaken)
        process.exitCode = 2
      } else {
        console.log(chalk.bold.red('Test failed'), formattedTimeTaken)
        process.exitCode = 1
      }
    } else {
      console.log(chalk.bold.green('すばらしい!'), formattedTimeTaken)
    }
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

async function runNext (tester, state, onError) {
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
    await Promise.resolve(promise)
    console.log('\b\b\b', chalk.bold.green('OK'), formatTimeTaken())
    showLog()
    tester.actionPassed()
  } catch (e) {
    const definition = 'Action defined\n    at ' + step.actionDefinition
    if (e.__prescriptPending) {
      console.log('\b\b\b', chalk.bold.cyan('PENDING'), formatTimeTaken())
      console.log(chalk.cyan(indentString('Aborting test because it is pending.\n' + definition, indent)))
    } else {
      console.log('\b\b\b', chalk.bold.red('NG'), formatTimeTaken())
      console.log(chalk.red(indentString(e.stack + '\n' + definition, indent)))
    }
    showLog()
    onError(e)
    tester.actionFailed(e)
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
