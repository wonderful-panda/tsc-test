[![Build Status](https://travis-ci.org/wonderful-panda/tsc-test.svg?branch=master)](https://travis-ci.org/wonderful-panda/tsc-test)

# tsc-test

Testing TypeScript compilation (should succeed or should fail)

## Basic usage

1. put `tsconfig.json` into test directory.

   `"noEmit"` is recommended.

    ```json
    {
        "compilerOptions": {
            "target": "es5",
            "module": "commonjs",
            "noEmit": true,
            "strictNullChecks": true
        },
        "filesGlob": [
            "*.ts"
        ],
        "exclude": [
            "node_modules"
        ]
    }
    ```

2. put files to be tested into test directory.

    ```typescript
    // should-succeed.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.foo);
    }
    ```

   When compilation errors should be occurred, write error code inline after 4 slashes(`////`).

    ```typescript
    // should-fail-1.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.bar);       //// TS2339
    }
    ```

   You can write part of error message after error code. (with colon)

    ```typescript
    // should-fail-2.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.bar);       //// TS2339: Property 'bar' does not exist on
    }
    ```

    Or regular expression.

    ```typescript
    // should-fail-3.ts (but this code is not wrong acturally ...)

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.foo);       //// TS2339: /property .* does not exist/i
    }
    ```


3. run `tsc-test` command

    ```
    $ tsc-test -p test/tsconfig.json
    ```

    And you will get output like below:

    ```
    OK: test/should-fail-1.ts
    OK: test/should-fail-2.ts
    NG: test/should-fail-3.ts
    OK: test/should-succeed.ts

    test/should-fail-3.ts:6
      expected: TS2339: /property .* does not exist/i
      bat was:  <no error>
    ```

## Run with test runner

### ava

```typescript
// runner.ts

import test from "ava";
import { Tester, formatFailureMessage } from "tsc-test";

const tester = Tester.fromConfig("<path to tsconfig.json>");
tester.sources.forEach(fileName => {
    test(fileName, t => {
        const failures = tester.test(fileName);
        if (failures.length > 0) {
            t.fail(formatFailureMessage(...failures));
        }
    })
});
```

## License
MIT

