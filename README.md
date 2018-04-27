
# prescript - an acceptance test runner [![CircleCI](https://circleci.com/gh/taskworld/prescript/tree/master.svg?style=svg)](https://circleci.com/gh/taskworld/prescript/tree/master)

__prescript__ is a JavaScript test micro-framework that helps make it fun to write end-to-end/acceptance tests.

> __Note:__ It is quite hard to explain in writing. I recommend watching this very short video demo instead. But I haven’t produced the video yet :(. Check back later then :)

Writing end-to-end tests (e.g. using Selenium) with unit-testing frameworks such as Mocha can sometimes be painful, because when some command fails to run, you need to re-run the test from the beginning to verify that you fixed it. End-to-end tests is usually very slow compared to unit tests.

prescript solves this problem by allowing you to express your tests as multiple, discrete steps.

```
Step 1. Open browser
Step 2. Request password reset
Step 2.1. Go to forgot password page
Step 2.2. Enter the email
Step 2.3. Submit the form
Step 3. Check email
Step 4. Click the reset password link in email
Step 5. Wait for reset password form to display
Step 6. Reset password to a new password
Step 7. Wait for login page to display
Step 8. Login with the new credentials
Step 9. I should be in the workspace
```

prescript comes with an __interactive development mode,__ in which you can __hot-reload the test script__ and __jump between steps.__ This means as you write your test, if you make a mistake you can fix it without having to re-run the whole test suite.


## Writing tests

Import `prescript` to access its APIs.

```js
const { test, to, action, defer, pending } = require('prescript')
```


### A basic test.

Use `test()` to define a test. Each test must have a unique name.

Inside each test, use `action()` to queue an action to be run at runtime.

```js
// Basic addition.js
const { test, to, action } = require('prescript')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

test('Basic addition', () => {
  action('Initialize the calculator', (state) => {
    state.calculator = new Calculator()
  })
  action('Enter 50 into the calculator', (state) => {
    state.calculator.enter(50)
  })
  action('Enter 70 into the calculator', (state) => {
    state.calculator.enter(70)
  })
  action('Press add', (state) => {
    state.calculator.add()
  })
  action('Stored result must be 120', (state) => {
    assert.equal(state.calculator.result, 120)
  })
})
```


### Nest steps to group related steps together

Multiple actions may be grouped using `to()`.

```js
test('Basic addition', () => {
  action('Initialize the calculator', (state) => {
    state.calculator = new Calculator()
  })
  to('Calculate 50 + 70', () => {
    action('Enter 50 into the calculator', (state) => {
      state.calculator.enter(50)
    })
    action('Enter 70 into the calculator', (state) => {
      state.calculator.enter(70)
    })
    action('Press add', (state) => {
      state.calculator.add()
    })
  })
  action('Stored result must be 120', (state) => {
    assert.equal(state.calculator.result, 120)
  })
})
```


### Use [page object pattern](http://martinfowler.com/bliki/PageObject.html) for more fluent and maintainable tests

Upgrading to this pattern is very beneficial when there are many test cases that reuses the same logic. For Selenium-based tests, I recommend reading [_Selenium: 7 Things You Need To Know_](https://www.lucidchart.com/techblog/2015/07/21/selenium-7-things-you-need-to-know-2/).

```js
// Basic addition.js
const { test } = require('prescript')
const CalculatorTester = require('../test-lib/CalculatorTester')

test('Basic addition', () => {
  CalculatorTester().add(50, 70).resultMustBe(120)
})
```

Now our test is a single line!

All the heavy lifting is in the CalculatorTester class:

```js
// CalculatorTester.js
const { to, named, action } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = function CalculatorTester () {
  action('Initialize the calculator', (state) => {
    state.calculator = new Calculator()
  })
  const calculatorTester = {
    add (a, b) {
      to(named `Calculate ${a} + ${b}`, () => {
        enter(a)
        enter(b)
        pressAdd()
      })
      return calculatorTester
    },
    resultMustBe (n) {
      action(named `Stored result must be ${n}`, (state) => {
        assert.equal(state.calculator.result, n)
      })
    }
  }
  function enter (number) {
    action(named `Enter ${number} into the calculator`, (state) => {
      state.calculator.enter(number)
    })
  }
  function pressAdd () {
    action('Press add', (state) => {
      state.calculator.add()
    })
  }
  return calculatorTester
}
```


## Running a test

To run a test in development mode:

```
./node_modules/.bin/prescript tests/Filename.js ["Test name"] -d
```

To run a test in non-interactive mode:

```
./node_modules/.bin/prescript tests/Filename.js ["Test name"]
```

**Test name** is optional if there is only one test. If a test file declares multiple test, you must explicitly specify the test name. You can list all tests using:

```
./node_modules/.bin/prescript tests/Filename.js --list
./node_modules/.bin/prescript tests/Filename.js --list --json
```

### Exit code

_(Only applies to non-interactive mode)_

| Exit Code | Description |
| --------- | ----------- |
| 0         | Successful test |
| 1         | Failed test |
| 2         | Pending test |
| 3         | Multiple tests defined |


### Running multiple tests

prescript __by design__ only runs a single test.
This allows prescript to remain a simple tool.
Then you can implement your own test orchestrator to fit your project needs:

- Run only a subset of tests.
- Run tests in parallel.
- Randomize or specify the order of tests.
- Retry failed tests.
- Prepare environment variables before running tests.

If prescript supported all of the above, it would make this micro-framework unnecessarily complex. Therefore, prescript encourages you to write your own test orchestrator. [It’s just a few lines of code!](./examples/testAll.js)


## API

### `to(name, () => { ... })`

Defines a composite step.


### `action(name, async (state, context) => { ... })`

Queue an action to be run. The function passed to `action()` will be called with these arguments:

- __state__ - The state object. In the beginning of the test, it is empty. Add things to this object to persist state between steps and reloads.

- __context__ - The context object contains:

    - `log(...)` - Logs a message to the console. Use this instead of `console.log()` so that it doesn’t mess up console output.


### `defer(name, async (state, context) => { ... })`

Queues a deferred action to be run at the end of test.
Note: The deferred action will be run only if all previous actions are run successfully.

```js
action('Open browser', (state) => {
  const options = { desiredCapabilities: { browserName: 'chrome' } }
  const browser = webdriverio.remote(options)
  state.browser = browser
  return browser.init()
})
defer('Quit browser', (state) => {
  action((state) => state.browser.end())
})
```


### `pending()`

Defines a pending step.
