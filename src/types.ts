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

export type StepDefName = StepName | string

export interface IConfig {
  wrapAction?: ActionWrapper
}

export type ActionWrapper = (
  step: IStep,
  execute: () => Promise<void>,
  state: Prescript.GlobalState,
  context: ITestExecutionContext
) => Promise<void>

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

export interface ITestExecutionContext {
  /**
   * This adds a log message to the current step.
   * API is the same as `console.log()`.
   * Use this function instead of `console.log()` to not clutter the console output.
   * @param format Format string, like `console.log()`
   * @param args Arguments to be formatted.
   */
  log(format: any, ...args: any[]): void

  /**
   * This adds an attachment to the current step, such as screenshot, JSON result, etc.
   * @param name Name of the attachment
   * @param buffer Attachment content
   * @param mimeType MIME type of the attachment (image/jpeg, text/plain, application/json...)
   */
  attach(name: string, buffer: Buffer, mimeType: string): void
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
  state: Prescript.GlobalState,
  context: ITestExecutionContext
) => void | Thenable
