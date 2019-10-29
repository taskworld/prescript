# API

Import `prescript` to access its APIs.

```js
const { test, to, action, defer, pending, named } = require('prescript')
```

## `test`

<!-- prettier-ignore-start -->
```js
test('Test name', () => { /* Define steps here */ })
test`Test name`(() => { /* Define steps here */ })
```
<!-- prettier-ignore-end -->

Creates a **test.**

## `to`

<!-- prettier-ignore-start -->
```js
to('Log in', () => { /* Define sub-steps here */ })
to`Log in`(() => { /* Define sub-steps here */ })
```
<!-- prettier-ignore-end -->

Creates a **composite step.**

## `action(name, async (state, context) => { ... })`

<!-- prettier-ignore-start -->
```js
action('Fill in username', async (state, context) => { /* Action here */ })
action`Fill in username`(async (state, context) => { /* Action here */ })
```
<!-- prettier-ignore-end -->

Creates an **action step.** The function passed to `action()` will be called
with these arguments:

* **state** - The state object. In the beginning of the test, it is empty. Add
  things to this object to share state between steps and have it persisted
  between reloads.
* **context** - The context object contains:
  * `log(...)` - Logs a message to the console. Use this instead of
    `console.log()` so that it doesn’t mess up console output.
  * `attach(name, buffer, mimeType)` — Attachs some binary output. For
    example, screenshots, raw API response. This will get written to the Allure
    report.

## `defer`

<!-- prettier-ignore-start -->
```js
defer('Close browser', async (state, context) => { /* Action here */ })
defer`Close browser`(async (state, context) => { /* Action here */ })
```
<!-- prettier-ignore-end -->

Creates a **deferred step** which queues an action to be run at the end of test.
If the test reached this step, the action will be queued for running at the end,
regardless of whether the test passed or not.

A common pattern is to create a deferred step for closing the resource right
after the action step that requested the resource.

```js
action('Open browser', async state => {
  const options = { desiredCapabilities: { browserName: 'chrome' } }
  const browser = webdriverio.remote(options)
  state.browser = browser
  await browser.init()
})
defer('Quit browser', state => {
  await state.browser.end()
})
```

## `pending()`

<!-- prettier-ignore-start -->
```js
pending()
```
<!-- prettier-ignore-end -->

Defines a **pending step.** When a pending step is run, it marks the test as pending.

- When running in **development mode**, this causes the test to **pause**.
- When run in **non-interactive mode**, prescript will **exit with code 2**.

See more example how to use a pending step [here](https://prescript.netlify.com/guide/writing-tests.html#pending-steps).

## `getCurrentState()`

Returns the current test state object. This method allows library functions to
access the current state without requiring user to pass the `state` object all
the way from the action.

This can make writing tests more convenient, but treat this like a global
variable — it introduces an _implicit_ runtime dependency from the caller to
prescript’s internal state.

## `getCurrentContext()`

Returns the current test state object. This method allows library functions to
access functions such as `context.log()` and `context.attachment()` without
requiring users to pass the `state` object all the way from the action.

This can make writing tests more convenient, but treat this like a global
variable — it introduces an _implicit_ runtime dependency from the caller to
prescript’s internal state.
