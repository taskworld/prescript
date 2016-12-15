
# prescript - an acceptance test runner [![CircleCI](https://circleci.com/gh/taskworld/prescript/tree/master.svg?style=svg)](https://circleci.com/gh/taskworld/prescript/tree/master)

`prescript` is a library for creating acceptance tests.

It comes with primitives to help you build highly-fluent DSLs for your test.

The tests are separated into two phases:

- __The prescription phase.__ It is the phase where the test script is prepared.
- __The runtime phase.__ Where tests gets actually run.

_Work in progress…_


## API

### `step(name, () => { ... })`

Defines a step. You can nest them.


### `cleanup(name, () => { ... })`

Defines a cleanup step. It’s different from normal steps:
they are always run even though previous steps failed.


### `action(async (state) => { ... })`

Defines the step’s ‘runtime action.’


### `onFinish(() => { ... })`

Defines code to run once the whole test finished loading.
This is a good time to add any cleanup step.
