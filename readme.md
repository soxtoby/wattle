Wattle
======
A hierarchical test runner for Node.

Getting Started
---------------
Install NPM package with:

```js
npm install --dev wattle
```

or

```js
yarn add --dev wattle
```

In your test test files, import the test functions:

```js
import { describe, when, then, it, test } from 'wattle';
```

(note that all these functions do the same thing - they're just for readability)

import an assertion library (I recommend chai):

```js
import { expect } from 'chai';
```

Then start testing:

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