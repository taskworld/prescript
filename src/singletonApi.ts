/**
 * Acceptance test tool.
 * @packageDocumentation
 */

import currentActionContext from './currentActionContext'
import { getInstance } from './singleton'
import { ActionFunction, StepDefName } from './types'
export { StepName } from './StepName'
export {
  ActionFunction,
  ActionWrapper,
  IConfig,
  IStep,
  ITestExecutionContext,
  ITestReporter,
  StepDefName,
  Thenable
} from './types'

/**
 * Creates a Test.
 * @public
 */
export function test<X>(name: string, f: () => X): X

/**
 * Creates a Test.
 * @public
 */
export function test(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): <X>(f: () => X) => X

// Implementation
export function test(...args) {
  return getInstance().test(...args)
}

/**
 * Creates a Compound Test Step, which can contain child steps.
 * @public
 */
export function to<X>(name: string, f: () => X): X

/**
 * Creates a Compound Test Step, which can contain child steps.
 * @public
 */
export function to(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): <X>(f?: () => X) => X

// Implementation
export function to(...args) {
  return getInstance().to(...args)
}

/**
 * Creates an Action Step to be performed at runtime.
 * @public
 */
export function action(name: string, f: ActionFunction): void

/**
 * Creates an Action Step to be performed at runtime.
 * @public
 */
export function action(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): (f?: ActionFunction) => void

/**
 * Deprecated: Makes the enclosing `step()` an Action Step.
 * @public
 * @deprecated Use `action(name, f)` or `action` template tag instead.
 */
export function action(f: ActionFunction): void

// Implementation
export function action(...args) {
  return getInstance().action(...args)
}

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 * @public
 */
export function defer(name: string, f: ActionFunction): void

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 * @public
 */
export function defer(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): (f?: ActionFunction) => void

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 */
export function defer(...args) {
  return getInstance().defer(...args)
}

/**
 * Creates a Pending step to make the test end with pending state.
 * Useful for unfinished tests.
 * @public
 */
export function pending(): void {
  getInstance().pending()
}

/**
 * Marks the steps inside as independent
 * @public
 */
export function independent<X>(f: () => X): X {
  return getInstance().independent(f)
}

/**
 * Deprecated.
 * @public
 * @deprecated Use `to()` instead.
 */
export function step<X>(name: StepDefName, f: () => X): X

/**
 * Deprecated.
 * @public
 * @deprecated Use `to()` instead.
 */
export function step(...args) {
  return getInstance().step(...args)
}

/**
 * Deprecated.
 * @public
 * @deprecated Use `defer()` instead.
 */
export function cleanup<X>(name: StepDefName, f: () => X): X

// Implementation
export function cleanup(...args) {
  return getInstance().cleanup(...args)
}

/**
 * Deprecated.
 * @public
 * @deprecated Use `defer()` instead.
 */
export function onFinish(f: () => void): void

// Implementation
export function onFinish(...args) {
  return getInstance().onFinish(...args)
}

/**
 * Returns the current state object.
 * This allows library functions to hook into prescript’s state.
 * @public
 */
export function getCurrentState() {
  if (!currentActionContext.current) {
    throw new Error('getCurrentState() must be called inside an action.')
  }
  return currentActionContext.current.state
}

/**
 * Returns the current action context object.
 * This allows library functions to hook into prescript’s current action context.
 * @public
 */
export function getCurrentContext() {
  if (!currentActionContext.current) {
    throw new Error('getCurrentContext() must be called inside an action.')
  }
  return currentActionContext.current.context
}

const stateCache = new WeakMap<any, Prescript.PrescriptionState>()

/**
 * Returns a state object that exists only during prescription phase for each test.
 * @public
 */
export function getCurrentPrescriptionState() {
  const instance = getInstance()
  if (stateCache.has(instance)) return stateCache.get(instance)!
  const state: Prescript.PrescriptionState = {}
  stateCache.set(instance, state)
  return state
}

export default {
  test,
  to,
  action,
  defer,
  pending,
  step,
  cleanup,
  onFinish,
  getCurrentState,
  getCurrentContext,
  getCurrentPrescriptionState
}
