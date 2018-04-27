import ms from 'ms'
import path from 'path'
import util from 'util'
import chalk from 'chalk'
import indentString from 'indent-string'

import createUI from './createUI'
import * as singleton from './singleton'
import walkSteps from './walkSteps'
import isStepExist from './isStepExist'
import createReporter from './createReporter'
import prettyFormatStep from './prettyFormatStep'
import createTestIterator from './createTestIterator'
import { ITestIterator, IStep, ITestLoadLogger } from './types'
import { StepName } from './StepName'
import { createConsoleLogger } from './loadTestModule'

function main(args) {
  const testModulePath = require('fs').realpathSync(args._[0])
  const requestedTestName = args._[1] || null

  if (args.l || args['list']) {
    listTests(testModulePath, { json: !!args.json })
    return
  }

  console.log(
    chalk.bold.magenta('# prescript'),
    'v' + require('../package').version
  )
  console.log()

  const dev = args.d || args['dev']
  if (dev) {
    runDevelopmentMode(testModulePath, requestedTestName)
  } else {
    runNonInteractiveMode(testModulePath, requestedTestName)
  }
}

function listTests(testModulePath: string, options: { json: boolean }) {
  const writer = options.json
    ? (() => {
        let written = false
        return {
          start() {
            process.stdout.write('[ ')
          },
          test(name: string) {
            if (written) process.stdout.write(', ')
            process.stdout.write(JSON.stringify(name) + '\n')
            written = true
          },
          finish() {
            process.stdout.write(']\n')
          }
        }
      })()
    : {
        start() {},
        test(name: string) {
          console.log(name)
        },
        finish() {}
      }
  writer.start()
  singleton.loadTests(
    () => {
      require(testModulePath)
    },
    {
      logger: {
        step() {},
        test(name: StepName) {
          writer.test(String(name))
        }
      }
    }
  )
  writer.finish()
}

function runDevelopmentMode(
  testModulePath: string,
  requestedTestName: string | null
) {
  const state = {}
  const tester: ITestIterator = createTestIterator(createLogVisitor())
  const ui = createUI()
  let previousResult: { stepNumber: string | null; error?: Error } | null = null

  function loadTest() {
    ui.testLoadStarted()
    try {
      const tests = singleton
        .loadTests(() => {
          require(testModulePath)
        })
        .filter(filterTest(requestedTestName))
      if (!tests.length) {
        throw new Error('To tests found.')
      }
      tester.setTest(tests[0])
      ui.testLoadCompleted(tests)
    } catch (e) {
      ui.testLoadError(e)
    }
  }

  function clearModuleCache() {
    const keysToRemove = Object.keys(require.cache).filter(shouldRemove)
    ui.moduleUncacheStarted()
    for (const key of keysToRemove) {
      delete require.cache[key]
      ui.moduleUncached(key)
    }

    function shouldRemove(filePath) {
      const components = filePath.split(path.sep)
      return (
        !components.includes('node_modules') &&
        !path.relative(process.cwd(), filePath).startsWith('..')
      )
    }
  }

  loadTest()
  tester.begin()
  let canceled = false

  ui.developmentModeStarted({
    tester,
    getState() {
      return state
    },
    getCurrentStepNumber() {
      return tester.getCurrentStepNumber()
    },
    getCurrentStep() {
      return tester.getCurrentStep()
    },
    getPreviousResult() {
      return previousResult
    },
    forEachStep(callback) {
      walkSteps(tester.getTest(), callback)
    },
    reload() {
      clearModuleCache()
      loadTest()
      const reloadResult: {
        jump?: { target: string | null; success: boolean }
      } = {}
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
    continue() {
      return runTestWhileConditionMet()
    },
    nextStep() {
      return runNextStep()
    },
    jumpTo(stepNumber) {
      tester.begin(stepNumber)
      previousResult = null
    },
    async runTo(stepNumber) {
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
    cancel() {
      canceled = true
    }
  })

  async function runTestWhileConditionMet(condition?) {
    const executeCondition = () =>
      typeof condition === 'function' ? condition() : true
    while (executeCondition() && !tester.isDone()) {
      if (await runNextStep()) break
      if (canceled) {
        ui.onUserInterrupted()
        canceled = false
        break
      }
    }
  }

  async function runNextStep() {
    let error
    const stepNumber = tester.getCurrentStepNumber()
    await runNext(tester, state, e => {
      error = e
    })
    previousResult = { stepNumber, error }
    return error
  }
}

function createFilteredLogger(
  requestedTestName: string | null
): ITestLoadLogger {
  const logger = createConsoleLogger()
  let active = !requestedTestName
  return {
    test(name) {
      if (requestedTestName) active = String(name) === requestedTestName
      if (active) logger.test(name)
    },
    step(step) {
      if (active) logger.step(step)
    }
  }
}

function runNonInteractiveMode(
  testModulePath: string,
  requestedTestName: string | null
) {
  console.log(chalk.bold.yellow('## Generating test plan...'))
  const tests = singleton
    .loadTests(
      () => {
        require(testModulePath)
      },
      { logger: createFilteredLogger(requestedTestName) }
    )
    .filter(filterTest(requestedTestName))
  if (!tests.length) {
    throw new Error('No tests found.')
  }
  if (tests.length > 1) {
    console.log()
    console.log(chalk.bold.red('Multiple tests found.'))
    console.log('  You must specify a test to run.')
    console.log('  Use `--list` to see a list of tests.')
    process.exitCode = 3
    return
  }
  console.log(
    chalk.dim('* ') + chalk.green('Test plan generated successfully.')
  )
  console.log()

  console.log(chalk.bold.yellow('## Running tests...'))
  runTest().catch(e =>
    setTimeout(() => {
      throw e
    })
  )

  async function runTest() {
    const state = {}
    const reporter = createReporter(testModulePath, tests[0].name)
    const tester = createTestIterator(
      createLogVisitor(),
      reporter.iterationListener
    )
    const errors: Error[] = []
    const started = Date.now()
    tester.setTest(tests[0])
    tester.begin()
    while (!tester.isDone()) {
      await runNext(tester, state, e => errors.push(e))
    }
    reporter.onFinish(errors)
    const timeTaken = Date.now() - started
    const formattedTimeTaken = chalk.dim(ms(timeTaken))
    if (errors.length) {
      if (errors.every(e => (e as any).__prescriptPending)) {
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

function createLogVisitor() {
  return {
    visitNode(node) {
      if (node.children) {
        console.log(chalk.dim('Step'), prettyFormatStep(node))
      }
    },
    visitDeferNode(node) {
      console.log(
        chalk.dim('Step'),
        prettyFormatStep(node),
        chalk.bold.magenta('DEFER')
      )
    }
  }
}

async function runNext(
  tester: ITestIterator,
  state,
  onError: (e: Error) => void
) {
  const step = tester.getCurrentStep()
  const indent = 7 + (step.number || '').length

  process.stdout.write(
    chalk.dim((step.defer ? 'Deferred ' : '') + 'Step ') +
      indentString(prettyFormatStep(step), indent).substr(indent) +
      '...'
  )
  const started = Date.now()
  const formatTimeTaken = () => chalk.dim(ms(Date.now() - started))
  const log: string[] = []
  const context = {
    log: (format, ...args) => {
      log.push(util.format(format, ...args))
    }
  }
  try {
    if (!step || !step.action) {
      throw new Error('Internal error: No step to run.')
    }
    const promise = step.action(state, context)
    if (
      (promise && typeof promise.then !== 'function') ||
      (!promise && promise !== undefined)
    ) {
      throw new Error(
        'An action should return a Promise (async) or undefined (sync).'
      )
    }
    await Promise.resolve(promise)
    console.log('\b\b\b', chalk.bold.green('OK'), formatTimeTaken())
    showLog()
    tester.actionPassed()
  } catch (e) {
    const definition = 'Action defined\n    at ' + step.actionDefinition
    if (e.__prescriptPending) {
      console.log('\b\b\b', chalk.bold.cyan('PENDING'), formatTimeTaken())
      console.log(
        chalk.cyan(
          indentString(
            'Aborting test because it is pending.\n' + definition,
            indent
          )
        )
      )
    } else {
      console.log('\b\b\b', chalk.bold.red('NG'), formatTimeTaken())
      console.log(chalk.red(indentString(e.stack + '\n' + definition, indent)))
    }
    showLog()
    onError(e)
    tester.actionFailed(e)
  }

  function showLog() {
    for (const item of log) {
      const logText =
        chalk.dim('* ') + chalk.cyan(indentString(item, 2).substr(2))
      console.log(indentString(logText, indent))
    }
  }
}

function filterTest(requestedTestName: string | null) {
  return (root: IStep) => {
    if (!requestedTestName) return true
    return String(root.name) === requestedTestName
  }
}

export default main
