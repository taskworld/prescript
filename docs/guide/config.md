# Advanced configuration

**prescript** will search from the test file’s directory for a
`prescript.config.js` file.

## Side-effects

Before prescript loads your test file, **prescript** will load the `prescript.config.js` file first.
You can use this opportunity to require other supporting modules that may alter Node.js’ runtime behavior.

Example usage:

- [Config prescript to allow writing tests in TypeScript](./typings.md#writing-tests-in-typescript)

## `wrapAction`

You can setup an action wrapper that will wrap all action steps. It is like a
middleware. It can be used for various purposes:

* Enhance the error message / stack trace.
* Benchmarking and profiling.
* etc.

```js
exports.wrapAction = async (step, execute, state, context) => {
  // Stuff to do before executing the action.
  // Example: Record the start time.
  try {
    // This line MUST be present. Otherwise, the test action will not run.
    return await execute()
  } catch (e) {
    // If you catch an error here, you must re-throw it
    // (either the original error or a wrapper).
    // Otherwise all steps will pass!
    //
    // If you don’t intend to catch an error, you can remove the catch block.
    throw e
  } finally {
    // Stuff to do after executing the action.
    // Example: Record the time, or take screenshot of a browser after each step.
  }
}
```

## `createTestReporter`

This allows you to create a custom reporter for your test, enabling custom reporting and integration with e.g. [OpenTelemetry](https://opentelemetry.io/). For more information, see the [type definition](https://github.com/taskworld/prescript/blob/master/api/prescript.d.ts#:~:text=*/-,createTestReporter,-) and [example](https://github.com/taskworld/prescript/tree/master/examples/reporters).
