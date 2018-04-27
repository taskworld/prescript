import path from 'path'
import chalk from 'chalk'
import * as StepName from './StepName'
import ErrorStackParser from 'error-stack-parser'
import prettyFormatStep from './prettyFormatStep'
import { IStep, ITestPrescriptionContext, ITestExecutionContext, ActionFunction, StepDefName, ITestLoadLogger } from './types';

type StackTrace = ErrorStackParser.StackFrame[]

function loadTest (
  testModule: (context: ITestPrescriptionContext) => void,
  options: { logger?: ITestLoadLogger | null } = { }
) {
  const { logger: inLogger = createConsoleLogger() } = options
  const finishActions: {
    action: () => void,
    definition: string,
    cause?: string
  }[] = [ ]
  const tests = [ ]
  let currentStep: IStep | null

  const logger: ITestLoadLogger = inLogger || createNullLogger()

  function appendStep<X> (options: {
    name: StepName.StepName,
    creator?: string,
    definition: string,
    cleanup?: boolean,
    defer?: boolean,
    pending?: boolean
  }, f: () => X): X {
    const { name, creator, definition, cleanup, defer, pending } = options
    if (!currentStep) {
      throw new Error('Invalid state... This should not happen!')
    }
    if (currentStep.action) {
      throw new Error('A step may only have an action or sub-steps but not both.')
    }
    const parentStep = currentStep
    if (!parentStep.children) {
      parentStep.children = [ ]
    }
    const number = (parentStep.number ? parentStep.number + '.' : '') + (parentStep.children.length + 1)
    const childStep: IStep = { name, creator, definition, cleanup, number, pending, defer }
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

  function setAction (f: ActionFunction, definition: string) {
    if (!currentStep) {
      throw new Error('Invalid state... This should not happen!')
    }
    if (currentStep.action) {
      throw new Error('A step may only have one action block.')
    }
    if (currentStep.children) {
      throw new Error('A step may only have an action or sub-steps but not both.')
    }
    currentStep.action = f
    currentStep.actionDefinition = definition
  }

  function getSource (stackTrace: StackTrace) {
    const stackFrame = stackTrace.filter(frame =>
      frame.fileName && path.relative(__dirname, frame.fileName).startsWith('..')
    )[0]
    if (!stackFrame) return '(unknown)'
    return stackFrame.fileName + ':' + stackFrame.lineNumber
  }

  const context: ITestPrescriptionContext = {
    step<X> (inName: StepDefName, f: () => X): X {
      const name = StepName.coerce(inName)
      const definition = getSource(ErrorStackParser.parse(new Error(`Step: ${name}`)))
      return appendStep({ name, definition }, f)
    },
    test<X> (name: StepDefName, f: () => X): X {
      return f()
    },
    cleanup<X> (inName: StepDefName, f: () => X): X {
      const name = StepName.coerce(inName)
      const definition = getSource(ErrorStackParser.parse(new Error(`Cleanup step: ${name}`)))
      return appendStep({ name, definition, cleanup: true }, f)
    },
    onFinish (f: () => void): void {
      if (!currentStep) {
        throw new Error('Invalid state... This should not happen!')
      }
      const definition = getSource(ErrorStackParser.parse(new Error(`onFinish`)))
      const cause = currentStep.number
      finishActions.push({ action: f, definition, cause })
    },
    use<X> (m: (context: ITestPrescriptionContext) => X): X {
      return m(context)
    },
    action<X> (arg0: StepDefName | ActionFunction, arg1?: ActionFunction): void {
      if (!arg1) {
        const definition = getSource(ErrorStackParser.parse(new Error(`Action definition`)))
        const f = arg0 as ActionFunction
        return setAction(f, definition)
      } else {
        const name = StepName.coerce(arg0 as StepDefName)
        const f = arg1 as ActionFunction
        const definition = getSource(ErrorStackParser.parse(new Error(`Action: ${name}`)))
        return appendStep({ name, definition }, () => {
          return setAction(f, definition)
        })
      }
    },
    defer<X> (inName: StepDefName, f: ActionFunction) {
      const name = StepName.coerce(inName)
      const definition = getSource(ErrorStackParser.parse(new Error(`Defer: {$name}`)))
      return appendStep({ name, definition, defer: true }, () => {
        return setAction(f, definition)
      })
    },
    to<X> (inName: string, f: () => X): X {
      const name = StepName.coerce(inName)
      const definition = getSource(ErrorStackParser.parse(new Error(`Step: ${name}`)))
      return appendStep({ name, definition }, f)
    },
    pending () {
      const error = new Error('[pending]')
      ;(error as any).__prescriptPending = true
      const definition = getSource(ErrorStackParser.parse(new Error(`Pending`)))
      return appendStep({ name: StepName.coerce('Pending'), definition, pending: true }, () => {
        context.action(() => { throw error })
      })
    }
  }

  function load () {
    const root: IStep = currentStep = {
      name: StepName.coerce('(root)'),
      children: [ ]
    }
    try {
      testModule(context)
      for (const entry of finishActions) {
        appendStep({
          name: StepName.coerce('Post-test actions'),
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
    step (step: IStep) {
      console.log(
        chalk.dim((step.defer ? 'Deferred ' : '') + 'Step'),
        prettyFormatStep(step)
      )
    }
  }
}

function createNullLogger () {
  return {
    step () {
    }
  }
}

export default loadTest
