const ErrorStackParser = require('error-stack-parser')
const chalk = require('chalk')
const prettyFormatStep = require('./prettyFormatStep')

function loadTest (testModule, { logger = createConsoleLogger() } = { }) {
  const finishActions = [ ]
  let currentStep

  logger = logger || createNullLogger()

  function appendStep ({ name, creator, definition, cleanup }, f) {
    if (currentStep.action) {
      throw new Error('A step may only have an action or sub-steps but not both.')
    }
    const parentStep = currentStep
    if (!parentStep.children) {
      parentStep.children = [ ]
    }
    const number = (parentStep.number ? parentStep.number + '.' : '') + (parentStep.children.length + 1)
    const childStep = { name, creator, definition, cleanup, number }
    parentStep.children.push(childStep)
    logger.step(childStep)
    try {
      currentStep = childStep
      const result = f()
      if (!childStep.children && !childStep.action) {
        throw new Error('Unexpected empty step. A step must either have children or an action.')
      }
      return result
    } finally {
      currentStep = parentStep
    }
  }

  function setAction (f) {
    if (currentStep.action) {
      throw new Error('A step may only have one action block.')
    }
    if (currentStep.children) {
      throw new Error('A step may only have an action or sub-steps but not both.')
    }
    currentStep.action = f
  }

  function getSource (stackTrace) {
    const stackFrame = stackTrace[1]
    if (!stackFrame) return '(unknown)'
    return stackFrame.fileName + ':' + stackFrame.lineNumber
  }

  const context = {
    step (name, f) {
      const definition = getSource(ErrorStackParser.parse(new Error(`Step: ${name}`)))
      return appendStep({ name, definition }, f)
    },
    cleanup (name, f) {
      const definition = getSource(ErrorStackParser.parse(new Error(`Cleanup step: ${name}`)))
      return appendStep({ name, definition, cleanup: true }, f)
    },
    onFinish (f) {
      const definition = getSource(ErrorStackParser.parse(new Error(`onFinish`)))
      const cause = currentStep.number
      finishActions.push({ action: f, definition, cause })
    },
    use (m) {
      return m(context)
    },
    action (f) {
      return setAction(f)
    }
  }

  function load () {
    const root = currentStep = {
      name: '(root)',
      children: [ ]
    }
    try {
      testModule(context)
      for (const entry of finishActions) {
        appendStep({
          name: 'Post-test actions',
          creator: entry.cause,
          definition: entry.definition,
          cleanup: true
        }, () => {
          entry.action()
        })
      }
    } finally {
      currentStep = null
    }
    return root
  }

  return load()
}

function createConsoleLogger () {
  return {
    step (step) {
      console.log(chalk.dim('*'), prettyFormatStep(step))
    }
  }
}

function createNullLogger () {
  return {
    step () {
    }
  }
}

module.exports = loadTest
