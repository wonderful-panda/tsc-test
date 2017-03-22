import * as ts from "typescript/lib/typescript";
import * as fs from "fs";
import * as path from "path";

/**
 * Expected compilation error.
 */
export interface ExpectedError {
    line: number;
    code: string;
    message?: RegExp;
}

/**
 * Actual compilation error.
 */
export interface ActualError {
    line: number;
    code: string;
    message?: string;
}

/**
 * Failure information (Mismatch of expected error and actual error)
 */
export interface Failure {
    line: number;
    expected?: ExpectedError;
    actual?: ActualError;
}

function getExpectedErrors(file: string): (ExpectedError|undefined)[] {
    const lines = fs.readFileSync(file).toString().split(/\r?\n/);
    const ret: ExpectedError[] = [];
    lines.forEach((line, n) => {
        const match = /\/\/\/\s*(TS[0-9]+)\s*:\s*(.*)$/.exec(line);
        if (match) {
            ret[n] = { line: n, code: match[1], message: new RegExp(match[2]) };
        }
    });
    return ret;
}

function getActualErrors(file: string, service: ts.LanguageService): (ActualError|undefined)[] {
    const errors: ActualError[] = [];
    service.getSemanticDiagnostics(file).forEach(d => {
        const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
        const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        errors[line] = { line, code: `TS${d.code}`, message };
    });
    return errors;
}

/**
 * Format failure object for pretty-print
 */
export function formatFailureMessage(failure: Failure) {
    let { line, expected, actual } = failure;
    expected = expected || { line, code: "<no error>" };
    actual = actual || { line, code: "<no error>" };
    const expectedString = expected.message ? `${ expected.code }: ${ expected.message }` : expected.code;
    const actualString = actual.message ? `${ actual.code }: ${ actual.message }` : actual.code;

    return (
`At line ${line + 1}
-----------
[expected]
${ expectedString.replace(/^/gm, "  ") }
[actual]
${ actualString.replace(/^/gm, "  ") }
`);
}

/**
 * Tester object
 */
export class Tester {
    service: ts.LanguageService;

    constructor(public compilerOptions: ts.CompilerOptions, public sources: string[], baseDir?: string) {
        const host = {
            getScriptFileNames: () => sources,
            getScriptVersion: f => "0",
            getScriptSnapshot: f => {
                if (!fs.existsSync(f)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(f).toString());
            },
            getCurrentDirectory: () => baseDir || process.cwd(),
            getCompilationSettings: () => compilerOptions,
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        };
        this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
    }

    public static fromConfigFile(configPath: string, sources?: string[], baseDir?: string): Tester {
        baseDir = baseDir || path.dirname(configPath);
        const content = fs.readFileSync(configPath).toString();
        const parsed = ts.parseJsonConfigFileContent(JSON.parse(content), ts.sys, baseDir);
        return new Tester(parsed.options,  sources || parsed.fileNames, baseDir);
    }

    public test(fileName: string): Failure[] {
        const expectedErrors = getExpectedErrors(fileName);
        const actualErrors = getActualErrors(fileName, this.service)
        const failures: Failure[] = [];
        for (let i = 0; i < expectedErrors.length || i < actualErrors.length; ++i) {
            const expected = expectedErrors[i];
            const actual = actualErrors[i];
            if (typeof expected === "undefined" || typeof actual === "undefined") {
                if (typeof expected !== typeof actual) {
                    failures.push({ line: i, expected, actual });
                }
            }
            else if (expected.code !== actual.code) {
                failures.push({ line: i, expected, actual });
            }
            else if (expected.message && actual.message && !expected.message.test(actual.message)) {
                failures.push({ line: i, expected, actual });
            }
        }
        return failures;
    }

    public testAll(onFail: (fileName: string, failures: Failure[]) => void): void {
        this.sources.forEach(fileName => {
            const failures = this.test(fileName);
            if (failures.length > 0) {
                onFail(fileName, failures);
            }
        });
    }
}
