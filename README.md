# prescript

**prescript** is a JavaScript test micro-framework that helps make it fun to write end-to-end/acceptance tests.

> **Note:** It is quite hard to explain in writing. I recommend watching this very short video demo instead. But I haven’t produced the video yet :\(. Check back later then :\)

Writing end-to-end tests \(e.g. using Selenium\) with unit-testing frameworks such as Mocha can sometimes be painful, because when some command fails to run, you need to re-run the test from the beginning to verify that you fixed it. End-to-end tests is usually very slow compared to unit tests.

prescript solves this problem by allowing you to express your tests as multiple, discrete steps.

```text
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

prescript comes with an **interactive development mode,** in which you can **hot-reload the test script** and **jump between steps.** This means as you write your test, if you make a mistake you can fix it without having to re-run the whole test suite.

## Writing tests

Import `prescript` to access its APIs.

```javascript
const { step, action } = require('prescript')
```

### Use `step()` to define a step

Each step should contain a single `action()`, which defines what to do when this step is run.

When using `action()`, you should pass a function that returns a Promise \(async action\) or returns nothing \(sync action\).

```javascript
// Basic addition.js
const { step, action } = require('prescript')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

step('Initialize the calculator', () => {
  action((state) => { state.calculator = new Calculator() })
})
step('Enter 50 into the calculator', () => {
  action((state) => { state.calculator.enter(50) })
})
step('Enter 70 into the calculator', () => {
  action((state) => { state.calculator.enter(70) })
})
step('Press add', () => {
  action((state) => { state.calculator.add() })
})
step('Stored result must be 120', () => {
  action((state) => { assert.equal(state.calculator.result, 120) })
})
```

### Nest steps to group related steps together

Steps may be nested:

```javascript
step('Initialize the calculator', () => {
  action((state) => { state.calculator = new Calculator() })
})
step('Calculate 50 + 70', () => {
  step('Enter 50 into the calculator', () => {
    action((state) => { state.calculator.enter(50) })
  })
  step('Enter 70 into the calculator', () => {
    action((state) => { state.calculator.enter(70) })
  })
  step('Press add', () => {
    action((state) => { state.calculator.add() })
  })
})
step('Stored result must be 120', () => {
  action((state) => { assert.equal(state.calculator.result, 120) })
})
```

### Use [page object pattern](http://martinfowler.com/bliki/PageObject.html) for more fluent and maintainable tests

Upgrading to this pattern is very beneficial when there are many test cases that reuses the same logic. For Selenium-based tests, I recommend reading [_Selenium: 7 Things You Need To Know_](https://www.lucidchart.com/techblog/2015/07/21/selenium-7-things-you-need-to-know-2/).

```javascript
// Basic addition.js
const CalculatorTester = require('../test-lib/CalculatorTester')
CalculatorTester().add(50, 70).resultMustBe(120)
```

Now our test is a single line!

All the heavy lifting is in the CalculatorTester class:

```javascript
// CalculatorTester.js
const { step, action } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = function CalculatorTester () {
  step('Initialize the calculator', () => {
    action((state) => { state.calculator = new Calculator() })
  })
  const calculatorTester = {
    add (a, b) {
      step(`Calculate ${a} + ${b}`, () => {
        enter(a)
        enter(b)
        pressAdd()
      })
      return calculatorTester
    },
    resultMustBe (n) {
      step(`Stored result must be ${n}`, () => {
        action((state) => { assert.equal(state.calculator.result, n) })
      })
    }
  }
  function enter (number) {
    step(`Enter ${number} into the calculator`, () => {
      action((state) => { state.calculator.enter(number) })
    })
  }
  function pressAdd () {
    step('Press add', () => {
      action((state) => { state.calculator.add() })
    })
  }
  return calculatorTester
}
```

## Running a test

To run a test in development mode:

```text
./node_modules/.bin/prescript tests/Filename.js -d
```

To run a test in non-interactive mode:

```text
./node_modules/.bin/prescript tests/Filename.js
```

### Exit code

_\(Only applies to non-interactive mode\)_

| Exit Code | Description |
| :--- | :--- |
| 0 | Successful test |
| 1 | Failed test |
| 2 | Pending test |

### Running multiple tests

prescript **by design** only runs a single test. This allows prescript to remain a simple tool. Then you can implement your own test orchestrator to fit your project needs:

* Run only a subset of tests.
* Run tests in parallel.
* Randomize or specify the order of tests.
* Retry failed tests.
* Prepare environment variables before running tests.

If prescript supported all of the above, it would make this micro-framework unnecessarily complex. Therefore, prescript encourages you to write your own test orchestrator. [It’s just a few lines of code!](https://github.com/taskworld/prescript/tree/78c094874fc3ae54107003ec976d211c106c330d/examples/testAll.js)

## API

### `step(name, () => { ... })`

Defines a step. May be nested.

A step may either contain

* a single action block
* nested steps

### `cleanup(name, () => { ... })`

Defines a cleanup step. It’s different from normal steps: they are always run even if previous steps failed.

### `action(async (state, context) => { ... })`

Defines the step’s ‘runtime action.’ The function passed to `action()` will be called with these arguments:

* **state** - The state object. In the beginning of the test, it is empty. Add things to this object to persist state between steps and reloads.
* **context** - The context object contains:
  * `log(...)` - Logs a message to the console. Use this instead of `console.log()` so that it doesn’t mess up console output.

### `onFinish(() => { ... })`

Defines code to run once the whole test finished loading. Can be used in conjunction with `cleanup()`:

```javascript
step('Open browser', () => {
  action(state => {
    const options = { desiredCapabilities: { browserName: 'chrome' } }
    const browser = webdriverio.remote(options)
    state.browser = browser
    return browser.init()
  })
})
onFinish(() => {
  cleanup('Quit browser', () => {
    action((state) => state.browser.end())
  })
})
```

### `pending()`

Defines a pending step.

