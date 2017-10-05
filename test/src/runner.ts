import * as path from "path";
import test from "ava";
import { Tester, formatFailureMessage } from "../..";

const baseDir = path.join(__dirname, "../testcases");
const tsconfig = path.join(baseDir, "tsconfig.json");
const tester = Tester.fromConfigFile(tsconfig);

function testTsFile(fileName: string) {
    return tester.test(path.join(baseDir, fileName));
}

test("expected 1 error", t => {
    const failures = testTsFile("expected-1-error.ts");
    t.true(failures.length === 0);
});

test("expected 2 errors", t => {
    const failures = testTsFile("expected-2-errors.ts");
    t.true(failures.length === 0);
});

test("expected 1 error - specify error code only", t => {
    const failures = testTsFile("expected-1-error-codeonly.ts");
    t.true(failures.length === 0);
});

test("unexpected 1 error", t => {
    const failures = testTsFile("unexpected-1-error.ts");
    t.true(failures.length === 1);
    const f = failures[0];
    t.true(f.line === 5 && f.expected === undefined);
    t.true(f.actual !== undefined && f.actual.code === "TS2322");
});

test("unexpected 2 errors", t => {
    const failures = testTsFile("unexpected-2-errors.ts");
    t.true(failures.length === 2);
    const [f1, f2] = failures;
    t.true(f1.line === 10 && f1.expected === undefined);
    t.true(f1.actual !== undefined && f1.actual.code === "TS2322");
    t.true(f2.line === 12 && f2.expected === undefined);
    t.true(f2.actual !== undefined && f2.actual.code === "TS2322");
});

test("unexpected 1 error - specify error code only", t => {
    const failures = testTsFile("unexpected-1-error-codeonly.ts");
    t.true(failures.length === 1);
    const f = failures[0];
    t.true(f.line === 5);
    t.true(f.expected !== undefined && f.expected.code === "TS0001");
    t.true(f.actual !== undefined && f.actual.code === "TS2322");
});

test("expected success", t => {
    const failures = testTsFile("expected-success.ts");
    t.true(failures.length === 0);
});

test("unexpected success", t => {
    const failures = testTsFile("unexpected-success.ts");
    t.true(failures.length === 3);
    const [f1, f2, f3] = failures;
    t.true(f1.line === 5);
    t.true(f1.expected !== undefined && f1.expected.code === "TS2324");
    t.true(f1.actual === undefined);

    t.true(f2.line === 10);
    t.true(f2.expected !== undefined && f2.expected.code === "TS2322");
    t.true(f2.actual === undefined);

    t.true(f3.line === 11);
    t.true(f3.expected !== undefined && f3.expected.code === "TS2322");
    t.true(f3.actual === undefined);
});

test("import modules", t => {
    const failures = testTsFile("import.ts");
    t.true(failures.length === 0);
});
