import { StepName } from './StepName'

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

export interface ITestPrescriptionContext {
  test<X>(name: StepDefName, f: () => X): X
  use<X>(f: (context: ITestPrescriptionContext) => X): X
  action<X>(name: StepDefName, f: ActionFunction): void
  defer<X>(name: StepDefName, f: ActionFunction): void
  to<X>(name: StepDefName, f: () => X): X
  pending(): void

  // Deprecated
  step<X>(name: StepDefName, f: () => X): X
  cleanup<X>(name: StepDefName, f: () => X): X
  onFinish(f: () => void): void
  action<X>(f: ActionFunction): void
}

export interface ITestLoadLogger {
  step(step: IStep): void
  test(name: StepName): void
}

export interface ITestExecutionContext {}

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

export type ActionFunction = (
  state: any,
  context: ITestExecutionContext
) => void | Promise<any>
