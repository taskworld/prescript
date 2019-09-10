import path from 'path'
import chalk from 'chalk'
import * as StepName from './StepName'
import ErrorStackParser from 'error-stack-parser'
import prettyFormatStep from './prettyFormatStep'
import {
  IStep,
  ActionFunction,
  StepDefName,
  ITestLoadLogger,
  IPrescriptAPI
} from './types'

type StackTrace = ErrorStackParser.StackFrame[]

export interface ITestLoadOptions {
  logger?: ITestLoadLogger | null
}

function loadTest(
  testModule: (context: IPrescriptAPI) => void,
  options: ITestLoadOptions = {}
): IStep[] {
  const { logger: inLogger = createConsoleLogger() } = options

  const implicitRoot: IStep = {
    name: StepName.named`[implicit test]`,
    children: []
  }

  const tests: IStep[] = []
  const usedTestNames = {}

  let currentStep: IStep | null
  let currentTest: ITest | null

  const logger: ITestLoadLogger = inLogger || createNullLogger()

  function appendStep<X>(
    options: {
      name: StepName.StepName
      creator?: string
      definition: string
      cleanup?: boolean
      defer?: boolean
      pending?: boolean
    },
    f: () => X
  ): X {
    const { name, creator, definition, cleanup, defer, pending } = options
    if (!currentStep) {
      throw new Error(
        'Invalid state... This should not happen! currentState is null.'
      )
    }
    if (currentStep.action) {
      throw new Error(
        'A step may only have an action or sub-steps but not both.'
      )
    }
    const parentStep = currentStep
    if (!parentStep.children) {
      parentStep.children = []
    }
    const number =
      (parentStep.number ? parentStep.number + '.' : '') +
      (parentStep.children.length + 1)
    const childStep: IStep = {
      name,
      creator,
      definition,
      cleanup,
      number,
      pending,
      defer
    }
    parentStep.children.push(childStep)
    logger.step(childStep)
    try {
      currentStep = childStep
      const result = f()
      if (!childStep.children && !childStep.action) {
        throw new Error(
          'Unexpected empty step. A step must either have children or an action.'
        )
      }
      return result
    } finally {
      currentStep = parentStep
    }
  }

  function setAction(f: ActionFunction, definition: string) {
    if (!currentStep) {
      throw new Error(
        'Invalid state... This should not happen! currentStep is null.'
      )
    }
    if (currentStep.action) {
      throw new Error('A step may only have one action block.')
    }
    if (currentStep.children) {
      throw new Error(
        'A step may only have an action or sub-steps but not both.'
      )
    }
    currentStep.action = f
    currentStep.actionDefinition = definition
  }

  function getSource(stackTrace: StackTrace) {
    const stackFrame = stackTrace.filter(
      frame =>
        frame.fileName &&
        path.relative(__dirname, frame.fileName).startsWith('..')
    )[0]
    if (!stackFrame) return '(unknown)'
    return stackFrame.fileName + ':' + stackFrame.lineNumber
  }

  function appendTest<X>(name: StepName.StepName, f: () => X): X {
    if (currentTest && currentTest.root === implicitRoot) {
      if (implicitRoot.children && implicitRoot.children.length) {
        throw new Error('An implicit test has been started.')
      }
      currentTest = null
      currentStep = null
    }
    if (currentTest) {
      throw new Error('test() calls may not be nested.')
    }
    const nameStr = String(name)
    if (usedTestNames[nameStr]) {
      throw new Error(
        `Test name must be unique. A test named "${nameStr}" has already been declared.`
      )
    }
    usedTestNames[nameStr] = true
    const root = (currentStep = {
      name: name,
      children: []
    })
    logger.test(name)
    currentTest = createTest(root)
    tests.push(root)
    try {
      const value = f()
      finishTest()
      return value
    } finally {
      currentStep = null
      currentTest = null
    }
  }

  function ensureDeprecatedAPIUsersDoNotUseTaggedTemplate(strings: any) {
    if (Array.isArray(strings)) {
      throw new Error(
        'The old deprecated API does not support tagged template literal syntax.'
      )
    }
  }

  const context: IPrescriptAPI = {
    step<X>(inName: StepDefName, f: () => X): X {
      ensureDeprecatedAPIUsersDoNotUseTaggedTemplate(inName)
      const name = StepName.coerce(inName)
      const definition = getSource(
        ErrorStackParser.parse(new Error(`Step: ${name}`))
      )
      return appendStep({ name, definition }, f)
    },
    test(...args: any[]): any {
      if (isTemplateString(args[0])) {
        const name = StepName.named(args[0], ...args.slice(1))
        return <X>(f: () => X) => appendTest(name, f)
      } else {
        const name = StepName.coerce(args[0])
        return appendTest(name, args[1])
      }
    },
    cleanup<X>(inName: StepDefName, f: () => X): X {
      ensureDeprecatedAPIUsersDoNotUseTaggedTemplate(inName)
      const name = StepName.coerce(inName)
      const definition = getSource(
        ErrorStackParser.parse(new Error(`Cleanup step: ${name}`))
      )
      return appendStep({ name, definition, cleanup: true }, f)
    },
    onFinish(f: () => void): void {
      if (!currentStep) {
        throw new Error(
          'Invalid state... This should not happen! currentStep is null.'
        )
      }
      if (!currentTest) {
        throw new Error(
          'Invalid state... This should not happen! currentTest is null.'
        )
      }
      const definition = getSource(
        ErrorStackParser.parse(new Error(`onFinish`))
      )
      const cause = currentStep.number
      currentTest.finishActions.push({ action: f, definition, cause })
    },
    use<X>(m: (context: IPrescriptAPI) => X): X {
      return m(context)
    },
    action<X>(...args: any[]): any {
      if (isTemplateString(args[0])) {
        const name = StepName.named(args[0], ...args.slice(1))
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Action Step: ${name}`))
        )
        return (f: ActionFunction) =>
          appendStep({ name, definition }, () => {
            return setAction(f, definition)
          })
      } else if (!args[1]) {
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Action definition`))
        )
        const f = args[0] as ActionFunction
        return setAction(f, definition)
      } else {
        const name = StepName.coerce(args[0])
        const f = args[1] as ActionFunction
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Action Step: ${name}`))
        )
        return appendStep({ name, definition }, () => {
          return setAction(f, definition)
        })
      }
    },
    defer(...args: any[]): any {
      if (isTemplateString(args[0])) {
        const name = StepName.named(args[0], ...args.slice(1))
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Deferred Action Step: ${name}`))
        )
        return (f: ActionFunction) =>
          appendStep({ name, definition, defer: true }, () => {
            return setAction(f, definition)
          })
      } else {
        const name = StepName.coerce(args[0])
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Deferred Action Step: {$name}`))
        )
        const f = args[1] as ActionFunction
        return appendStep({ name, definition, defer: true }, () => {
          return setAction(f, definition)
        })
      }
    },
    to(...args: any[]): any {
      if (isTemplateString(args[0])) {
        const name = StepName.named(args[0], ...args.slice(1))
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Composite Step: ${name}`))
        )
        return <X>(f: () => X) => appendStep({ name, definition }, f)
      } else {
        const name = StepName.coerce(args[0])
        const definition = getSource(
          ErrorStackParser.parse(new Error(`Composite Step: ${name}`))
        )
        const f = args[1]
        return appendStep({ name, definition }, f)
      }
    },
    pending() {
      const error = new Error('[pending]')
        ; (error as any).__prescriptPending = true
      const definition = getSource(ErrorStackParser.parse(new Error(`Pending`)))
      return appendStep(
        { name: StepName.coerce('Pending'), definition, pending: true },
        () => {
          context.action(() => {
            throw error
          })
        }
      )
    }
  }

  function finishTest() {
    if (!currentTest) {
      throw new Error('Invalid state... currentTest is null.')
    }
    for (const entry of currentTest.finishActions) {
      appendStep(
        {
          name: StepName.coerce('Post-test actions'),
          creator: entry.cause,
          definition: entry.definition,
          cleanup: true
        },
        () => {
          entry.action()
        }
      )
    }
  }

  function load() {
    currentStep = implicitRoot
    currentTest = createTest(implicitRoot)
    try {
      testModule(context)
      if (currentTest !== null) {
        finishTest()
      }
    } finally {
      currentStep = null
      currentTest = null
    }
    if (
      !tests.length &&
      implicitRoot.children &&
      implicitRoot.children.length
    ) {
      tests.push(implicitRoot)
    }
    return tests
  }

  return load()
}

export function createConsoleLogger() {
  return {
    step(step: IStep) {
      console.log(
        chalk.dim((step.defer ? 'Deferred ' : '') + 'Step'),
        prettyFormatStep(step)
      )
    },
    test(name: StepName.StepName) {
      console.log(chalk.yellow(`### ${StepName.format(name)}`))
    }
  }
}

export function createNullLogger() {
  return {
    step(step: IStep) { },
    test(name: StepName.StepName) { }
  }
}

interface ITest {
  root: IStep
  finishActions: {
    action: () => void
    definition: string
    cause?: string
  }[]
}

function createTest(root: IStep): ITest {
  return { root, finishActions: [] }
}

export default loadTest

function isTemplateString(input: any): input is TemplateStringsArray {
  return Array.isArray(input)
}
