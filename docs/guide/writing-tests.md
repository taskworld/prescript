# Writing tests in prescript

## Conceptual model

In prescript, your “test” (scenario) is separated into multiple discrete
“steps”.

```text
Test: Sucessful password reset
├── Step 1. Open browser
├── Deferred Step 2. Close browser
├── Step 3. Request password reset
│   ├── Step 3.1. Go to forgot password page
│   ├── Step 3.2. Enter the email
│   └── Step 3.3. Submit the form
├── Step 4. Open the password reset link in email
│   ├── Step 4.1. Check the email
│   ├── Step 4.2. Open the reset password email
│   └── Step 4.3. Click the reset password link in email
├── Step 5. Reset password
│   ├── Step 5.1. Enter the new password
│   └── Step 5.2. Submit the form
├── Step 6. Login with the new credentials
└── Step 7. I should be in the workspace
```

There are **4 types of steps**:

* **Action steps** performs some kind of action. If an action fail, all
  subsequent steps will be aborted.
* **Deferred steps** queues an action to be run at the end of the test. It will
  be run when the test is completed or terminated due to an error in one of the
  action steps.
* **Composite steps** can contain child steps.
* **Pending steps** marks the test as pending. Its behavior is equivalent to a
  failed action step. This is useful when your test is not complete.

## Programming model

We write our test in JavaScript. The above test can be represented in
**prescript** as JavaScript code like this:

<!-- prettier-ignore-start -->
```js
const { test, to, action, defer } = require('prescript')
test('Sucessful password reset', () => {
  action('Open browser', async state => { ... })
  defer('Close browser', async state => { ... })
  to('Request password reset', () => {
    action('Go to forgot password page', async state => { ... })
    action('Enter the email', async state => { ... })
    action('Submit the form', async state => { ... })
  })
  to('Open the password reset link in email', () => {
    action('Check the email', async state => { ... })
    action('Open the reset password email', async state => { ... })
    action('Click the reset password link in email', async state => { ... })
  })
  to('Reset password', () => {
    action('Enter the new password', async state => { ... })
    action('Submit the form', async state => { ... })
  })
  action('Login with the new credentials', () => { ... })
  action('I should be in the workspace', () => { ... })
})
```
<!-- prettier-ignore-end -->

Since the test file is a JavaScript file, you can also generate actions
indirectly (see the Page Object section down below for an example).

## Execution phases

When you run **prescript**, there are 2 phases that your code gets executed:

* **Prescripting phase.** In this phase, your test code is executed to determine
  what tests are available, including the steps in each test. This results in a
  **test plan** being generated.

* **Running phase.** In this phase, prescript executes the actions according to
  the test plan generated from the previous phase.

## A basic test

Use `test()` to define a test. Each test must have a unique name.

Use `action()` to create an **action step**. You should pass a function that
either returns a Promise \(async action\) or returns nothing \(sync action\).

```javascript
// Basic addition.js
const { test, to, action } = require('prescript')
const assert = require('assert')
const Calculator = require('../lib/Calculator')

test('Basic addition', () => {
  action('Initialize the calculator', state => {
    state.calculator = new Calculator()
  })
  action('Enter 50 into the calculator', state => {
    state.calculator.enter(50)
  })
  action('Enter 70 into the calculator', state => {
    state.calculator.enter(70)
  })
  action('Press add', state => {
    state.calculator.add()
  })
  action('Stored result must be 120', state => {
    assert.equal(state.calculator.result, 120)
  })
})
```

## Use composite steps to group related steps together

Multiple actions may be grouped using `to()`. This creates a **composite step.**

```js
// Basic addition.js
test('Basic addition', () => {
  action('Initialize the calculator', state => {
    state.calculator = new Calculator()
  })
  to('Calculate 50 + 70', () => {
    action('Enter 50 into the calculator', state => {
      state.calculator.enter(50)
    })
    action('Enter 70 into the calculator', state => {
      state.calculator.enter(70)
    })
    action('Press add', state => {
      state.calculator.add()
    })
  })
  action('Stored result must be 120', state => {
    assert.equal(state.calculator.result, 120)
  })
})
```

## Use [page object pattern](http://martinfowler.com/bliki/PageObject.html) for more fluent and maintainable tests

Upgrading to this pattern is very beneficial when there are many test cases that
reuses the same logic.

For more, I highly recommend reading
[_Selenium: 7 Things You Need To Know_](https://www.lucidchart.com/techblog/2015/07/21/selenium-7-things-you-need-to-know-2/),
even for people who don’t use Selenium. The article contains a lot of great tips
for anyone who writes end-to-end tests. And these tips applies even if you’re
using something else (e.g. Puppeteer, Appium, etc) to test your app.

```javascript
// Basic addition.js
const { test } = require('prescript')
const CalculatorTester = require('../test-lib/CalculatorTester')

test('Basic addition', () => {
  CalculatorTester()
    .add(50, 70)
    .resultMustBe(120)
})
```

Now our test is much shorter.

All the heavy lifting is now in the CalculatorTester class, which can be shared
by many tests:

```javascript
// CalculatorTester.js
const { to, named, action } = require('../../..')
const Calculator = require('../lib/Calculator')
const assert = require('assert')

module.exports = function CalculatorTester() {
  action('Initialize the calculator', state => {
    state.calculator = new Calculator()
  })
  const calculatorTester = {
    add(a, b) {
      to(named`Calculate ${a} + ${b}`, () => {
        enter(a)
        enter(b)
        pressAdd()
      })
      return calculatorTester
    },
    resultMustBe(n) {
      action(named`Stored result must be ${n}`, state => {
        assert.equal(state.calculator.result, n)
      })
    }
  }
  function enter(number) {
    action(named`Enter ${number} into the calculator`, state => {
      state.calculator.enter(number)
    })
  }
  function pressAdd() {
    action('Press add', state => {
      state.calculator.add()
    })
  }
  return calculatorTester
}
```

::: tip THE `named` HELPER

There’s a `named` helper that lets you generate a step name with variable
interpolations. When displayed in test log, the substituted variable will be
differently colored.

:::
