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

Defines a **pending step.**
