import * as ts from "typescript/lib/typescript";
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
/**
 * Format failure object for pretty-print
 */
export declare function formatFailureMessage(failure: Failure): string;
/**
 * Tester object
 */
export declare class Tester {
    compilerOptions: ts.CompilerOptions;
    sources: string[];
    service: ts.LanguageService;
    baseDir: string;
    constructor(compilerOptions: ts.CompilerOptions, sources: string[], baseDir?: string);
    static fromConfigFile(configPath: string, sources?: string[], baseDir?: string): Tester;
    test(fileName: string): Failure[];
    testAll(onFail: (fileName: string, failures: Failure[]) => void): void;
}
