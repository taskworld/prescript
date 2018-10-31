# Running a test (CLI)

## Development mode

The **development mode** provides the **prescript interactive shell** which
allows you to hot-reload the tests, or jump to steps in the test.

To run a test in development mode:

```
yarn prescript tests/Filename.js -d
```

## Non-interactive mode

The **non-interactive mode** is for using in CI systems. The prescript
interactive shell is not available here, but an Allure test result files may be
generated in this mode.

To run a test in non-interactive mode:

```
yarn prescript tests/Filename.js
```

## When a test file contain multiple tests

As introduced earlier, a prescript process only runs a single test once.
However, for ease of use and flexibility, a test file may define multiple tests.
Each test can be uniquely identified by its **test name.**

You don’t have to specify the test name to run if there is only one test.
However, if a test file declares multiple tests, prescript will refuse to run.
In this case, you must explicitly specify the name of the test to run.

```bash
yarn prescript [-d] tests/Filename.js "Test name"
```

You can list all tests using:

```bash
yarn prescript tests/Filename.js --list
yarn prescript tests/Filename.js --list --json
```

## Exit code

::: tip NOTE

Exit codes only apply to non-interactive mode

:::

| Exit Code | Description            |
| --------- | ---------------------- |
| 0         | Successful test        |
| 1         | Failed test            |
| 2         | Pending test           |
| 3         | Multiple tests defined |

## Running multiple tests

prescript **by design** only runs a single test. This allows prescript to remain
a simple tool. You must implement your own test orchestrator to fit it to your
project needs, which may include:

* Running all tests.
* Running only a subset of tests.
* Running tests sequentially.
* Running tests in parallel.
* Distributing tests to be run on a cluster of test runner machines.
* Randomizing or specify the order of tests.
* Retrying failed tests.
* Aborting the test in case of too many failures.
* Preparing environment variables before running tests.

If prescript supported all of the above, it would make prescript unnecessarily
complex. Therefore, prescript requires you to write your own test orchestrator.
[It’s just a few lines of code!](https://github.com/taskworld/prescript/tree/78c094874fc3ae54107003ec976d211c106c330d/examples/testAll.js)
