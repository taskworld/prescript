# API

Import `prescript` to access its APIs.

```js
const { test, to, action, defer, pending } = require('prescript')
```

## `test(name, () => { ... })`

Creates a **test.**

## `to(name, () => { ... })`

Creates a **composite step.**

## `action(name, async (state, context) => { ... })`

Creates an **action step.** The function passed to `action()` will be called
with these arguments:

* **state** - The state object. In the beginning of the test, it is empty. Add
  things to this object to share state between steps and have it persisted
  between reloads.
* **context** - The context object contains:
  * `log(...)` - Logs a message to the console. Use this instead of
    `console.log()` so that it doesn’t mess up console output.

## `defer(name, async (state, context) => { ... })`

Creates a **deferred step** which queues an action to be run at the end of test.

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

Defines a **pending step.**
