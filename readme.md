# Wattle
...as in, "wattle happen when I run _this_ code?"

Wattle is a hierarchical test runner for Node that aims to make writing tests as easy as possible.

## Getting Started
Install NPM package both locally and globally with:

```js
npm install --save-dev wattle
npm install --global wattle
```

or

```js
yarn add --dev wattle
yarn global add wattle
```

In your test files, import the test functions:

```js
import { describe, when, then, it, test } from 'wattle';
```

(note that all these functions do the same thing - they're just for readability)

Import an assertion library (I recommend chai):

```js
import { expect } from 'chai';
```

Then start writing tests:

```js
describe("my class", () => {
    let sut = new MyClass(); // setup

    when("poked", () => {
        sut.poke(); // more setup

        when("prodded", () => {
            sut.prod(); // even more setup (nest as much as you want)

            it("does what it's told", () => expect(sut.didTheThing).to.be.true);
        });

        sut.settleDown(); // clean up after being poked and prodded
    });
});
```

To run the tests, just run the `wattle` command from the folder containing your test files.


## Command Line
```
wattle [-t|--test-files] <test file globs> [options]
```

Option                 |Description
-----------------------|-----------
`-t`, `--test-files`   | One or more globs of test files to run.
`-m`, `--middleware`   | Add one or more middleware modules.
`-s`, `--show-stacks`  | Include stack traces in output.
`-v`, `--verbosity`    | Logging verbosity (`quiet`, `default`, or `full`).
`-b`, `--build-server` | Output results in a format suitable for a build server. Currently supports TeamCity, AppVeyor, and TFS/VSTS.

## Build Server Support
With the `--build-server` option, test results will be automatically logged to TeamCity and AppVeyor. For TFS/VSTS, wattle will create a `wattle-results.trx` file that needs to be published with a **Publish Test Results** build step.

## Visual Studio Code Integration
There are example launch and task configurations in the `examples` folder that you can use to get started. The task configuration includes a problem matcher will will show test failures as errors in the code.

## Middleware
You can specify custom middleware with the `--middleware` option. Middleware modules should export an `ITestMiddleware` object as their default export. The easiest way to implement middleware is to extend `TestMiddleware`:

```ts
// CustomMiddleware.ts
import { TestMiddleware } from 'wattle';

class CustomMiddleware extends TestMiddleware {
    // Override one or more methods here
}

export default new CustomMiddleware();
```

and then use it with:
```
wattle -m ./CustomMiddleware
```