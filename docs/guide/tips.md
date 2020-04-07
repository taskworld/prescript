# Tips for writing tests

## Use the Page Object pattern

You can create classes to implement the Page Object pattern. At Taskworld, we
use this pattern to help keep our test code more concise. We also get
IntelliSense while we write our test code!

![Screenshot](./page-object-intellisense.png)

You can read more about this pattern in
[_Use page object pattern for more fluent and maintainable tests_](./writing-tests.md#use-page-object-pattern-for-more-fluent-and-maintainable-tests)
section.

## Retrying

Some steps may take more than 1 try to be able to be successfully carried out.
You can create a `retry` function that will run your function for up to 3 times.

```js
async function retry(f, n = 3) {
  let error
  for (let i = 0; i < n; i++) {
    try {
      return await f()
    } catch (e) {
      error = e
    }
  }
  throw error
}
```

And use it like this:

```js
action('Action', async state => {
  await retry(async () => {
    // ... your code ...
  })
})
```

In some situations, e.g. waiting for changes to be propagated throughout the cluster,
we may not be sure how many times we have to retry.
Instead of retrying for a fixed number of time,
we can also retry until it takes unreasonably long instead.

```js
export default async function retryUntilTimeout(f, timeout = 15000) {
  const start = Date.now()
  let i = 0
  for (;;) {
    try {
      return await f(i++)
    } catch (error) {
      if (Date.now() - start > timeout) {
        throw error
      } else {
        const timeToWait = 100 + (Date.now() - start) / 10 // Fine-tune this
        await new Promise((r) => setTimeout(r, timeToWait))
      }
    }
  }
}
```

## Recovery mechanism

Sometimes your tests may be interrupted by **“ENTER YOUR EMAIL TO SUBSCRIBE TO
OUR NEWSLETTER”** or **“WE HAVE UPDATED OUR PRIVACY POLICY”** or similar modal
dialogs.

You may create an “attemptRecovery” function that will attempt to get you out of
the situation.

```js
async function attemptRecovery(state, context) {
  // dismiss GDPR modal, if exists
  // dismiss newsletter subscribe modal, if exists
  // dismiss Intercom modal, if exists
  // ...
}
```

Then you can use it in conjection with `retry()` for more resilience.

```js
action('Action', async (state, context) => {
  await retry(async () => {
    await attemptRecovery(state, context)
    // ... your code ...
  })
})
```
