import * as ts from "typescript/lib/typescript";
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
/**
 * Format failure object for pretty-print
 */
export declare function formatFailureMessage(...failures: Failure[]): string;
/**
 * For internal use
 */
export declare function formatResultForCli(fileName: string, failures: Failure[]): string;
/**
 * Tester object
 */
export declare class Tester {
    compilerOptions: ts.CompilerOptions;
    sources: string[];
    service: ts.LanguageService;
    constructor(compilerOptions: ts.CompilerOptions, sources: string[]);
    static fromConfigFile(configPath: string, sources?: string[]): Tester;
    test(fileName: string): Failure[];
    testAll(cb: (fileName: string, failures: Failure[]) => void): boolean;
}
