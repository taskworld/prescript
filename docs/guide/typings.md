# VS Code JavaScript IntelliSense and/or TypeScript Support

Out of the box, **prescript** comes with a type declaration file. This means it
will work with
[VS Code IntelliSense for JavaScript](https://code.visualstudio.com/docs/languages/javascript)
right away, even if you are using just JavaScript.

![Screenshot](./typing-hint.png)

## Writing tests in TypeScript

If you want to write tests in TypeScript, you can [configure prescript](./config.md#side-effects) to inject `ts-node` into the Node.js runtime.
This will let you write tests in TypeScript.

1. Install `ts-node`.

2. Create `prescript.config.js` with this contents:

    ```js
    require('ts-node/register/transpile-only')
    ```

## Declaring the type of prescript `state`

The type of `state` variable, passed to your action functions in `action()` and
`defer()` APIs defaults to an `unknown` type.

![Screenshot](./typing-unknown.png)

That means that by default you don’t get autocompletion when writing actions:

![Screenshot](./typing-nocomplete.png)

To fix this, you can define the type of your prescript `state` by following
these steps:

1.  If you are not using TypeScript,
    [set up a JavaScript project in VS Code](https://code.visualstudio.com/docs/languages/javascript#_javascript-projects-jsconfigjson)
    by creating a `jsconfig.json` file at the root of your project.

    ```json
    {
      "compilerOptions": { "target": "ES6" },
      "include": ["tests"],
      "exclude": ["node_modules", "**/node_modules/*"]
    }
    ```

    Reload VS Code after creating this file to make sure that VS Code picks up
    the configuration file.

2.  Create a file `state.d.ts` which will contain the type definition of your
    state. It should declare an interface `GlobalState` in a global namespace
    `Prescript`, thus triggering
    [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
    Here’s an example:

    ```typescript
    import * as puppeteer from 'puppeteer'

    declare global {
      namespace Prescript {
        interface GlobalState {
          browser: puppeteer.Browser
          page: puppeteer.Page
        }
      }
    }

    export {}
    ```

    Anything you add to the `GlobalState` interface inside `Prescript` namespace
    will show up in the type of the `state` variable.

3.  Now you have IntelliSense for your test state!

![Screenshot](./typing-complete.png)
