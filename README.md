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
    // should-be-compiled.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.foo);
    }
    ```

   When compilation errors should be occurred, write error code inline after 4 slashes(`////`).

    ```typescript
    // should-be-failed.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.bar);       //// TS2339
    }
    ```

   You can write part of error message after error code. (with colon)

    ```typescript
    // should-be-failed-2.ts

    interface Foo { foo: string; }

    export function test(foo: Foo) {
        console.log(foo.bar);       //// TS2339: Property 'bar' does not exist on
    }
    ```

3. run `tsc-test` command

    ```
    $ tsc-test -p test/tsconfig.json
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

