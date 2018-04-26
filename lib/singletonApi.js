const { getInstance } = require('./singleton')

module.exports = {
  /**
   * Creates a test.
   */
  test (name, f) {
    return getInstance().test(name, f)
  },
  /**
   * Defines a compound test step.
   */
  to (name, f) {
    return getInstance().to(name, f)
  },
  /**
   * Defines an action to be run at runtime.
   */
  action (name, f) {
    return getInstance().action(name, f)
  },
  /**
   * Defines a deferred action, e.g. for cleanup.
   */
  defer (name, f) {
    return getInstance().defer(name, f)
  },
  /**
   * Defines a pending action to make the test end with pending state.
   * Useful for unfinished tests.
   */
  pending () {
    return getInstance().pending()
  },
  named: require('./StepName').named,
  /** @deprecated Use `to()` instead. */
  step (name, f) {
    return getInstance().step(name, f)
  },
  /** @deprecated Use `defer()` instead. */
  cleanup (name, f) {
    return getInstance().cleanup(name, f)
  },
  /** @deprecated Use `defer()` instead. */
  onFinish (f) {
    return getInstance().onFinish(f)
  },
}
