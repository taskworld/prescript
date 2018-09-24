import { StepName } from './StepName'

/// <reference path="./globalStateDeclaration.d.ts" />

export type StepDefName = StepName | string

export interface IStep {
  name: StepName
  number?: string
  children?: IStep[]
  creator?: string
  definition?: string

  action?: ActionFunction
  actionDefinition?: string

  pending?: boolean
  cleanup?: boolean
  defer?: boolean
}

export interface ITestPrescriptionAPI {
  /**
   * Creates a test.
   */
  test<X>(name: StepDefName, f: () => X): X

  /**
   * Defines a compound test step.
   */
  to<X>(name: StepDefName, f: () => X): X

  /**
   * Defines an action to be run at runtime.
   */
  action<X>(name: StepDefName, f: ActionFunction): void
  /**
   * Defines an action to be run at runtime.
   */
  action<X>(f: ActionFunction): void

  /**
   * Defines a deferred action, e.g. for cleanup.
   */
  defer<X>(name: StepDefName, f: ActionFunction): void

  /**
   * Defines a pending action to make the test end with pending state.
   * Useful for unfinished tests.
   */
  pending(): void

  /** @deprecated Use `to()` instead. */
  step<X>(name: StepDefName, f: () => X): X
  /** @deprecated Use `defer()` instead. */
  cleanup<X>(name: StepDefName, f: () => X): X
  /** @deprecated Use `defer()` instead. */
  onFinish(f: () => void): void
}

export interface ITestPrescriptionContext extends ITestPrescriptionAPI {
  use<X>(f: (context: ITestPrescriptionContext) => X): X
}

export interface ITestLoadLogger {
  step(step: IStep): void
  test(name: StepName): void
}

export interface ITestExecutionContext {
  /**
   * This adds a log message to the current step.
   * API is the same as `console.log()`.
   * Use this function instead of `console.log()` to not clutter the console output.
   * @param format Format string, like `console.log()`
   * @param args Arguments to be formatted.
   */
  log(format: any, ...args: any[]): void
}

export interface IIterationListener {
  onEnter(node: IStep)
  onExit(node: IStep, error?: Error)
}

export interface IVisitor {
  visitNode(node: IStep)
  visitDeferNode(node: IStep)
}

export interface ITestIterator {
  setTest(test: IStep)
  getTest(): IStep
  begin(beginningStep?: string | null)
  getCurrentStepNumber(): string | null
  getCurrentStep(): IStep
  isDone(): boolean
  actionPassed(): void
  actionFailed(error: Error): void
}

interface Thenable {
  then(
    onFulfilled?: ((value: any) => any) | undefined | null,
    onRejected?: ((reason: any) => any) | undefined | null
  ): Thenable
}

export type ActionFunction = (
  state: PrescriptGlobalState,
  context: ITestExecutionContext
) => void | Thenable
