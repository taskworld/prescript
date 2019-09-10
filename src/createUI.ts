import chalk from 'chalk'
import util from 'util'
import prettyFormatStep from './prettyFormatStep'

export default function createUI() {
  const ui = {
    testLoadStarted() {
      console.log(
        chalk.bold.yellow('## Loading test and generating test plan...')
      )
    },
    testLoadCompleted(test) {
      console.log(
        chalk.dim('* ') + chalk.green('Test plan generated successfully!')
      )
      console.log()
    },
    testLoadError(e: Error) {
      console.log(chalk.bold.red('Cannot load the test file.'))
      console.log(chalk.red(e.stack || 'Unknown stack trace...'))
      console.log()
    },

    moduleUncacheStarted() {
      console.log(chalk.bold.yellow('## Clearing Node module cache...'))
    },
    moduleUncached(key: string) {
      console.log(chalk.dim('*'), 'Reloading', chalk.cyan(key))
    },
    moduleUncacheCompleted() {
      console.log()
    },

    onUserInterrupted() {
      console.log(chalk.yellow('Interrupted by user.'))
    },

    developmentModeStarted(environment) {
      startInteractiveMode(environment)
    }
  }

  function startInteractiveMode(environment) {
    console.log(chalk.bold.yellow('## Entering development mode...'))
    console.log('Welcome to prescript development mode.')
    console.log()
    announceStatus()
    hint('help', 'for more information')
    console.log()

    const vorpal = require('vorpal')()

    vorpal
      .command('inspect')
      .alias('i')
      .description('Inspect the test state')
      .action(function(args, callback) {
        console.log('This is current test state:')
        console.log(util.inspect(environment.getState()))
        console.log()
        callback()
      })

    vorpal
      .command('status')
      .alias('s')
      .description('Show the test status')
      .action(function(args, callback) {
        console.log('This is the test plan with current test status:')
        const currentStepNumber = environment.getCurrentStepNumber()
        const previousResult = environment.getPreviousResult()
        let printed = false
        environment.forEachStep(step => {
          const prefix =
            step.number === currentStepNumber
              ? chalk.bold.blue('次は')
              : previousResult && step.number === previousResult.stepNumber
              ? previousResult.error
                ? chalk.bold.bgRed(' NG ')
                : chalk.bold.bgGreen(' OK ')
              : '    '
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

    vorpal
      .command('reload')
      .alias('r')
      .description('Reload the test file')
      .action(function(args, callback) {
        const reloadResult = environment.reload()
        console.log('Test file is reloaded.')
        const jump = reloadResult.jump
        if (jump) {
          if (jump.success) {
            console.log(
              'Jumping to',
              prettyFormatStep(environment.getCurrentStep())
            )
          } else {
            console.log('Cannot jump to previously run step ' + jump.target)
          }
        }
        console.log()
        announceStatus()
        console.log()
        callback()
      })

    vorpal
      .command('continue')
      .alias('c')
      .description('Continue running the test until there is an error')
      .action(function(args, callback) {
        handleRun(environment.continue(), callback)
      })
      .cancel(() => {
        environment.cancel()
      })

    vorpal
      .command('next')
      .alias('n')
      .description('Run the next step.')
      .action(function(args, callback) {
        handleRun(environment.nextStep(), callback)
      })

    vorpal
      .command('jump <stepNumber>')
      .alias('j')
      .description('Jump to a step number')
      .action(function(args, callback) {
        environment.jumpTo(String(args.stepNumber))
        announceStatus()
        console.log()
        callback()
      })

    vorpal
      .command('runto <stepNumber>')
      .description('Run from current step to step number')
      .action(function(args, callback) {
        handleRun(environment.runTo(String(args.stepNumber)), callback)
      })

    vorpal.delimiter('prescript>').show()

    function handleRun(promise, callback) {
      return promise.then(
        () => {
          announcePrevious()
          announceStatus()
          console.log()
          callback && callback()
        },
        err => {
          callback && callback(err)
        }
      )
    }

    function announcePrevious() {
      const previousResult = environment.getPreviousResult()
      if (previousResult) {
        if (previousResult.error) {
          console.log(
            chalk.bold.red(
              'Step ' + previousResult.stepNumber + ' encountered an error'
            )
          )
        }
      }
    }

    function announceStatus() {
      const previousResult = environment.getPreviousResult()
      const current = environment.getCurrentStepNumber()
      if (previousResult && previousResult.error) {
        hint('reload', 'after fixing the test to reload the test file')
      }
      if (current) {
        console.log(
          chalk.bold.blue('次は'),
          prettyFormatStep(environment.getCurrentStep())
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
  }

  function hint(commandName, description) {
    console.log('Type', chalk.cyan(commandName), description)
  }

  return ui
}
