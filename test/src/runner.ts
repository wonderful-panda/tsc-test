import * as path from "path";
import test from "ava";
import { Tester, formatFailureMessage } from "../..";

const baseDir = path.join(__dirname, "../testcases");
const tsconfig = path.join(baseDir, "tsconfig.json");
let tester: Tester;

test.before(t => {
    tester = Tester.fromConfigFile(tsconfig);
});

test("expected 1 error", t => {
    const failures = tester.test("expected-1-error.ts");
    t.true(failures.length === 0);
});

test("expected 2 errors", t => {
    const failures = tester.test("expected-2-errors.ts");
    t.true(failures.length === 0);
});

test("unexpected 1 error", t => {
    const failures = tester.test("unexpected-1-error.ts");
    t.true(failures.length === 1);
    const f = failures[0];
    t.true(f.line === 5 && f.expected === undefined);
    t.true(f.actual !== undefined && f.actual.code === "TS2322");
});

test("unexpected 2 errors", t => {
    const failures = tester.test("unexpected-2-errors.ts");
    t.true(failures.length === 2);
    const [ f1, f2 ] = failures;
    t.true(f1.line === 10 && f1.expected === undefined);
    t.true(f1.actual !== undefined && f1.actual.code === "TS2322");
    t.true(f2.line === 12 && f2.expected === undefined);
    t.true(f2.actual !== undefined && f2.actual.code === "TS2322");
});
