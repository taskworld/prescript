import { StepName } from './StepName'

declare global {
  namespace Prescript {
    interface GlobalState {
      [key: string]: unknown
    }
    interface PrescriptionState {
      [key: string]: unknown
    }
  }
}

/**
 * @public
 */
export type StepDefName = StepName | string

/**
 * Configuration defined in the `prescript.config.js` file.
 * For more information, see the {@link https://taskworld.github.io/prescript/guide/config.html | advanced configuration guide}.
 * @public
 */
export interface IConfig {
  /**
   * You can setup an action wrapper that will wrap all action steps. It is like a middleware.
   *
   * @remarks
   * It can be used for various purposes:
   * - Enhance the error message / stack trace.
   * - Benchmarking and profiling.
   * - etc.
   *
   * @alpha
   */
  wrapAction?: ActionWrapper

  /**
   * Create a custom test reporter.
   * @remarks
   * It is very important that the reporter do not throw an error.
   * Otherwise, the behavior of prescript is undefined.
   * @param testModulePath - The path of the test file.
   * @alpha
   */
  createTestReporter?(testModulePath: string, testName: string): ITestReporter
}

/**
 * @alpha
 */
export type ActionWrapper = (
  step: IStep,
  execute: () => Promise<void>,
  state: Prescript.GlobalState,
  context: ITestExecutionContext
) => Promise<void>

/**
 * @alpha
 */
export interface IStep {
  name: StepName
  number?: string
  children?: IStep[]
  creator?: string
  definition?: string
  independent?: boolean

  action?: ActionFunction
  actionDefinition?: string

  pending?: boolean
  cleanup?: boolean
  defer?: boolean
}

export interface ITestLoadLogger {
  step(step: IStep): void
  test(name: StepName): void
}

// Note: Keep this interface in sync with `singletonApi.ts` exports!
export interface IPrescriptAPI {
  test<X>(name: string, f: () => X): X
  test(
    nameParts: TemplateStringsArray,
    ...substitutions: any[]
  ): <X>(f: () => X) => X

  to<X>(name: string, f: () => X): X
  to(
    nameParts: TemplateStringsArray,
    ...substitutions: any[]
  ): <X>(f: () => X) => X

  action(name: string, f: ActionFunction): void
  action(
    nameParts: TemplateStringsArray,
    ...substitutions: any[]
  ): (f: ActionFunction) => void
  action(f: ActionFunction): void

  defer(name: string, f: ActionFunction): void
  defer(
    nameParts: TemplateStringsArray,
    ...substitutions: any[]
  ): (f: ActionFunction) => void

  pending(): void

  step<X>(name: StepDefName, f: () => X): X

  cleanup<X>(name: StepDefName, f: () => X): X

  onFinish(f: () => void): void

  independent<X>(f: () => X): X

  // This is only in IPrescriptAPI
  use(f: (api: IPrescriptAPI) => void): void
}

/**
 * @public
 */
export interface ITestExecutionContext {
  /**
   * This adds a log message to the current step.
   * API is the same as `console.log()`.
   * Use this function instead of `console.log()` to not clutter the console output.
   * @param format - Format string, like `console.log()`
   * @param args - Arguments to be formatted.
   */
  log(format: any, ...args: any[]): void

  /**
   * This adds an attachment to the current step, such as screenshot, JSON result, etc.
   * @param name - Name of the attachment
   * @param buffer - Attachment content
   * @param mimeType - MIME type of the attachment (image/jpeg, text/plain, application/json...)
   */
  attach(name: string, buffer: Buffer, mimeType: string): void
}

export interface IIterationListener {
  onEnter: (node: IStep) => void
  onExit: (node: IStep, error?: Error) => void
}

/**
 * @alpha
 */
export interface ITestReporter {
  /**
   * Called when the test is finished.
   * @param errors - Errors that occurred during the test.
   *  If there are no errors, this will be an empty array.
   *  Note that pending tests are treated the same way as errors.
   *  To check if an error object represents a pending test, use the {@link isPendingError} function.
   */
  onFinish(errors: Error[]): void

  /**
   * Called when the test step is being entered.
   * @param step - The test step that is being entered.
   */
  onEnterStep(step: IStep): void

  /**
   * Called when the test step is being exited.
   * @param step - The test step that is being exited.
   * @param error - The error that occurred during the test step.
   */
  onExitStep(step: IStep, error?: Error): void
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

/**
 * @public
 */
export interface Thenable {
  then(
    onFulfilled?: ((value: any) => any) | undefined | null,
    onRejected?: ((reason: any) => any) | undefined | null
  ): Thenable
}

/**
 * @public
 */
export type ActionFunction = (
  state: Prescript.GlobalState,
  context: ITestExecutionContext
) => void | Thenable
