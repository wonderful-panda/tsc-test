import * as ts from "typescript/lib/typescript";
import * as fs from "fs";
import * as path from "path";
import { colors } from "./colors";

/**
 * Expected compilation error.
 */
export interface ExpectedError {
    code: string;
    message?: RegExp | string;
}

/**
 * Actual compilation error.
 */
export interface ActualError {
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
    detail: string;
}

function judge(
    line: number,
    expected: ExpectedError | undefined,
    actual: ActualError | undefined
): Failure | undefined {
    if (typeof expected === "undefined" || typeof actual === "undefined") {
        if (expected) {
            return { line, expected, actual, detail: "unexpected success" };
        } else if (actual) {
            return { line, expected, actual, detail: "unexpected error" };
        } else {
            return undefined;
        }
    } else if (expected.code !== actual.code) {
        return { line, expected, actual, detail: "unexpected error code" };
    } else if (expected.message && actual.message) {
        if (expected.message instanceof RegExp) {
            if (!expected.message.test(actual.message)) {
                return { line, expected, actual, detail: "unexpected error message" };
            }
        } else {
            // expected.message is string
            if (actual.message.indexOf(expected.message) < 0) {
                return { line, expected, actual, detail: "unexpected error message" };
            }
        }
    }
    return undefined;
}

function parseExpectedErrorMessage(detail?: string): RegExp | string {
    if (!detail) {
        return "";
    }
    const match = /^\/(.*)\/([a-z]*)\s*$/.exec(detail);
    if (match) {
        return new RegExp(match[1], match[2]);
    } else {
        return detail;
    }
}

function getExpectedErrors(file: string): (ExpectedError | undefined)[] {
    const lines = fs
        .readFileSync(file)
        .toString()
        .split(/\r?\n/);
    const ret: ExpectedError[] = [];
    lines.forEach((line, n) => {
        const match = /\/\/\/\s*(TS[0-9]+)(?:\s*:\s*(.*))?$/.exec(line);
        if (match) {
            ret[n] = { code: match[1], message: parseExpectedErrorMessage(match[2]) };
        }
    });
    return ret;
}

function getActualErrors(file: string, service: ts.LanguageService): (ActualError | undefined)[] {
    const errors: ActualError[] = [];
    service.getSemanticDiagnostics(file).forEach(d => {
        let line = -1;
        if (d.file && d.start !== undefined) {
            line = d.file.getLineAndCharacterOfPosition(d.start).line;
        }
        const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        errors[line] = { code: `TS${d.code}`, message };
    });
    return errors;
}

/**
 * For internal use
 */
export function formatError(
    error: ExpectedError | ActualError | undefined,
    title: string,
    titleColor?: ((s: string) => string),
    detailColor?: ((s: string) => string)
): string {
    let indent = "                ";
    while (indent.length < title.length) {
        indent += indent;
    }
    indent = indent.substr(0, title.length);
    const tc = titleColor || colors.none;
    const dc = detailColor || colors.none;
    const err = error || { code: "<no error>" };

    const text = err.message ? `${err.code}: ${err.message}` : err.code;
    return text.replace(/^(.*)$/gm, (_, content, offset) => {
        return (offset == 0 ? tc(title) : indent) + dc(content);
    });
}

/**
 * Format failure object for pretty-print
 */
export function formatFailureMessage(...failures: Failure[]): string {
    const ret: string[] = [];
    failures.forEach(failure => {
        ret.push(`At line.${failure.line + 1}`);
        ret.push(formatError(failure.expected, "  expected: "));
        ret.push(formatError(failure.actual, "  but was:  "));
    });
    return ret.join("\n");
}

/**
 * Tester object
 */
export class Tester {
    service: ts.LanguageService;

    constructor(public compilerOptions: ts.CompilerOptions, public sources: string[]) {
        const host: ts.LanguageServiceHost = {
            getScriptFileNames: () => sources,
            getScriptVersion: f => "0",
            getScriptSnapshot: f => {
                if (!fs.existsSync(f)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(f).toString());
            },
            getCurrentDirectory: () => process.cwd(),
            getCompilationSettings: () => compilerOptions,
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
            resolveModuleNames: (moduleNames, containingFile) => {
                const resolutionHost = { fileExists: ts.sys.fileExists, readFile: ts.sys.readFile };
                const ret = [] as ts.ResolvedModule[];
                moduleNames.forEach(name => {
                    const resolved = ts.resolveModuleName(
                        name,
                        containingFile,
                        compilerOptions,
                        resolutionHost
                    ).resolvedModule;
                    if (resolved !== undefined) {
                        ret.push(resolved);
                    }
                });
                return ret;
            }
        };
        this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
    }

    public static fromConfigFile(configPath: string, sources?: string[]): Tester {
        const content = fs.readFileSync(configPath).toString();
        const parsed = ts.parseJsonConfigFileContent(
            JSON.parse(content),
            ts.sys,
            path.dirname(configPath)
        );
        return new Tester(parsed.options, sources || parsed.fileNames);
    }

    public test(fileName: string): Failure[] {
        const expectedErrors = getExpectedErrors(fileName);
        const actualErrors = getActualErrors(fileName, this.service);
        const failures: Failure[] = [];
        for (let i = 0; i < expectedErrors.length || i < actualErrors.length; ++i) {
            const expected = expectedErrors[i];
            const actual = actualErrors[i];
            const failure = judge(i, expected, actual);
            if (failure) {
                failures.push(failure);
            }
        }
        return failures;
    }

    public testAll(cb: (fileName: string, failures: Failure[]) => void): boolean {
        let ret = true;
        this.sources.forEach(fileName => {
            const failures = this.test(fileName);
            cb(fileName, failures);
            if (failures.length > 0) {
                ret = false;
            }
        });
        return ret;
    }
}
