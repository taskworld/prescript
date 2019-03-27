import { ActionFunction, StepDefName } from './types'
import currentActionContext from './currentActionContext'
export { IConfig } from './types'
const { getInstance } = require('./singleton')

/**
 * Creates a Test.
 */
export function test<X>(name: string, f: () => X): X

/**
 * Creates a Test.
 */
export function test(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): <X>(f: () => X) => X

/**
 * Creates a Test.
 */
export function test(...args) {
  return getInstance().test(...args)
}

/**
 * Creates a Compound Test Step, which can contain child steps.
 */
export function to<X>(name: string, f: () => X): X

/**
 * Creates a Compound Test Step, which can contain child steps.
 */
export function to(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): <X>(f: () => X) => X

/**
 * Creates a Compound Test Step, which can contain child steps.
 */
export function to(...args) {
  return getInstance().to(...args)
}

/**
 * Creates an Action Step to be performed at runtime.
 */
export function action(name: string, f: ActionFunction): void

/**
 * Creates an Action Step to be performed at runtime.
 */
export function action(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): (f: ActionFunction) => void

/**
 * Makes the enclosing `step()` an Action Step.
 * @deprecated
 */
export function action(f: ActionFunction): void

/**
 * Creates an Action Step to be performed at runtime.
 */
export function action(...args) {
  return getInstance().action(...args)
}

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 */
export function defer(name: string, f: ActionFunction): void

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 */
export function defer(
  nameParts: TemplateStringsArray,
  ...substitutions: any[]
): (f: ActionFunction) => void

/**
 * Creates a Deferred Action Step, for, e.g., cleaning up resources.
 */
export function defer(...args) {
  return getInstance().defer(...args)
}

/**
 * Creates a Pending step to make the test end with pending state.
 * Useful for unfinished tests.
 */
export function pending(): void {
  getInstance().pending()
}

/** @deprecated Use `to()` instead. */
export function step<X>(name: StepDefName, f: () => X): X

/** @deprecated Use `to()` instead. */
export function step(...args) {
  return getInstance().step(...args)
}

/** @deprecated Use `defer()` instead. */
export function cleanup<X>(name: StepDefName, f: () => X): X

/** @deprecated Use `defer()` instead. */
export function cleanup(...args) {
  return getInstance().cleanup(...args)
}

/** @deprecated Use `defer()` instead. */
export function onFinish(f: () => void): void

/** @deprecated Use `defer()` instead. */
export function onFinish(...args) {
  return getInstance().onFinish(...args)
}

/**
 * Returns the current state object.
 * This allows library functions to hook into prescript’s state.
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
 */
export function getCurrentContext() {
  if (!currentActionContext.current) {
    throw new Error('getCurrentContext() must be called inside an action.')
  }
  return currentActionContext.current.context
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
  getCurrentContext
}
