
# prescript - an acceptance test runner [![CircleCI](https://circleci.com/gh/taskworld/prescript/tree/master.svg?style=svg)](https://circleci.com/gh/taskworld/prescript/tree/master)

__prescript__ is a JavaScript test framework that helps make it fun to write end-to-end/acceptance tests.

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


## How to write tests

Import `prescript` to access its APIs.

```js
const { step, action } = require('prescript')
```


### Use `step()` to define a step

Each step should contain a single `action()`, which defines what to do when this step is run.

When using `action()`, you should pass a function that returns a Promise (async action) or returns nothing (sync action).

```js
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

```js
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

```js
// Basic addition.js
const CalculatorTester = require('../test-lib/CalculatorTester')
CalculatorTester().add(50, 70).resultMustBe(120)
```

```js
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


## API

### `step(name, () => { ... })`

Defines a step. May be nested.

A step may either contain

- a single action block

- nested steps


### `cleanup(name, () => { ... })`

Defines a cleanup step. It’s different from normal steps:
they are always run even if previous steps failed.


### `action(async (state) => { ... })`

Defines the step’s ‘runtime action.’


### `onFinish(() => { ... })`

Defines code to run once the whole test finished loading. Can be used in conjunction with `cleanup()`:

```js
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

