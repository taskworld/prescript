# prescript

**prescript** is a Node.js-based test runner that helps make it fun to write
end-to-end/acceptance tests.

Writing functional and end-to-end tests \(e.g. using Puppeteer or Selenium\)
with unit-testing frameworks such as Mocha can sometimes be painful, because
when one step failed, you have to re-run the test from the beginning to verify
that you fixed it. End-to-end tests is usually very slow compared to unit tests.

**prescript** solves this problem by allowing you to express your tests as
multiple, discrete steps. **prescript** then comes with an interactive
**development mode,** in which you can **hot-reload the test script** and **jump
between steps.**

This means as you run your tests as you write it. And if you make a mistake you
can fix your test, hot reload, and continue testing, without having to re-run
the whole test suite.

## Documentation

[Documentation is available on our website.](https://taskworld.github.io/prescript/)

## Development

Running Prescript example scenarios:

```sh
yarn test-examples
```

Running individual scenario:

```sh
./bin/prescript "./examples/calculator/tests/Basic addition (page object).js"
```

Running unit tests:

```sh
yarn test
```