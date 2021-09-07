# Introduction

This page will attempt to give you an **executive overview** and explain **why
we created prescript** in the first place. It also explains some of our design
choices.

If you want to dive in right away, feel free to
<span onclick="alert('okay.')">[skip this section](./tutorial.md)</span>.

## What’s that, friend? Yet another testing framework??

**prescript** is a test runner that’s designed to solve this one pain point:

::: tip PAIN POINT

**When a test fails, we had to re-run our test all the way from the very
beginning.** This makes writing E2E tests painful for a long multi-step
scenarios (e.g. user onboarding tests). It’s especially frustrating when we need
to debug part of a test scenario that’s flaky.

:::

**prescript** solves this pain point by providing an **interactive development
mode.** In this mode, if your test fails, prescript will pause your test where
it failed. You can fix your test, hot reload the code in, and resume running,
without having to re-run your test from the beginning.

This makes **prescript** suitable for developing functional or E2E (end-to-end)
tests, although you can use it for other kind of tests as well.

## Any other features?

**prescript** has few other features:

### It’s easily _parallelizable…_ hmm, is that a word?

E2E tests usually take quite a long time to run (compared to unit tests).

To be scalable, we need to think about running these tests in parallel.

prescript’s philosophy is **“1 test = 1 file.”** This makes it very easy to
distribute tests across multiple machines. We at Taskworld run about 36 tests
simultaneously.

::: tip NOTE

**prescript** does not have a notion of ‘test suites’; the CLI only runs a
single test. You need to write your own script in order to run multiple tests.
This gives you complete control and thus maximum flexibility in orchestrating
your tests.

For simple projects, a simple shell script may suffice, i.e.
`for I in tests/*.js; do yarn prescript "$I"; done`. For larger projects you can
utilize orchestration tools provided by your platform, e.g. you may use
[CircleCI’s split testing support](https://circleci.com/docs/2.0/parallelism-faster-jobs/)
to run tests in parallel on CircleCI.

:::

### Beautiful report, thanks to someone else

**prescript** integrates with
[Allure Framework](https://docs.qameta.io/allure/):

> Allure Framework is a flexible lightweight multi-language test report tool
> that not only shows a very concise representation of what have been tested in
> a neat web report form, but allows everyone participating in the development
> process to extract maximum of useful information from everyday execution of
> tests.

::: tip

Click on the link above that says ‘Allure Framework’ to witness the beauty of
the generated test reports!

:::

### We’ve been using it for 2 years internally

We at [Taskworld](https://taskworld.com/) developed prescript and have been
using it to test our production code for 2 years, so you may say it’s quite
matured now.

### …but we don’t provide support… wait, this isn’t a feature?

I wanted to be upfront about this:

We open-sourced prescript primarily so that other people can benefit from our
tool. However, we don’t plan to provide support for this tool outside of our use
cases. And there may even be breaking changes where necessary (breaking changes
for you are breaking changes for us, too). Therefore, please be prepared to help
yourself.

Please feel free to fork this tool and adapt it to your use cases. Pull requests
are welcome.

## prescript is not a framework?

**prescript** is not a framework; it’s ~~a people~~ a **test runner.** What did
I mean by that? Let’s say you want to test a web application. You’ll need to
have these components set up:

1.  **Browser automation library.** This allows you to programmatically control
    a browser. Normally you would use
    [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) or
    [puppeteer](https://www.npmjs.com/package/puppeteer).

    * **prescript** doesn’t care. You can use any library you want. That means you
    can also use prescript to test mobile apps, desktop apps, CLI tools, APIs, or
    anything.

2.  **Test runner.** They provide a way to organize your test code and run it.
    **prescript** is a test runner. Different test runners have different ways
    of organizing your test code. For example:

    * [mocha](https://www.npmjs.com/package/mocha) lets your organize tests into
      “suites” and “tests”, using `describe` and `it` (or `suite` and `test`).
    * [cucumber](https://cucumber.io/) lets you organize your “executable
      specifications” into “features” and “scenarios” using the Gherkin syntax.
    * **prescript** lets you organize your test code into “tests” and “steps.” A
      step may contain sub-steps.

3.  **Assertion library.** These provides you with an API to make assertions.
    This includes
    [Node.js’s `assert` module](https://nodejs.org/api/assert.html),
    [Chai](http://chaijs.com/api/bdd/), etc. Some test tools, such as
    [Jest](https://jestjs.io) provides its own built-in assertion library.
    prescript doesn’t.

    * **prescript** doesn’t care. You can use any library you want.

4.  **Test reporter.** These components generate a beautiful test report for
    other humans to see (or for other computer programs to further process).

    * **prescript** does not come with its own reporter, but it integrates with
      [Allure Framework](https://docs.qameta.io/allure/).

5.  **Test orchestrator.** You have many tests, but how do you run them? One by
    one, sequentially? In parallel, on the same process? On separate processes?
    On separate machines? On an on-demand auto-scaling cluster that runs tests
    in a containerized environment? In which order? If they fail, do you retry
    them? For how many times? Do you retry immediately, or retry at the end of
    the test batch? Should tests be aborted if too many tests failed in a row?
    That’s the job of the test orchestrator — it determines which tests to run
    when.

    * **prescript** doesn’t care. A prescript process only runs a single test
      once. That means you must write your own orchestrator.

Several testing frameworks, such as [Cypress](https://www.cypress.io/),
[Codecept](https://codecept.io/) and [Nightwatch](http://nightwatchjs.org/)
comes with all of them integrated in a single package, but **prescript** is just
a test runner.

So, why this extreme **modularity**?

1.  Being modular allows you to use prescript to test anything. As of writing,
    [Cypress](https://www.cypress.io/) is known to provide one of the best
    testing experiences for web apps, but it’s only for web apps.

    With prescript, [our testing experience](./tutorial.md) can be used for
    anything you may want to test.

2.  Different projects have different test orchestration needs (as illustrated
    above), and it depends on the use case, the technology stack, the scale, and
    other constraints.

    Making prescript support all of them would make it unnecessarily complex. By
    not doing any orchestration, it reduces complexity (and maintenance burden)
    for us, and gives flexibility for you.

So, think of **prescript** as a building block you can use to create great
testing experience!
