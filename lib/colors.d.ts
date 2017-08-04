/// <reference types="chalk" />
import * as chalk from "chalk";
export declare const colors: {
    none: (s: string) => string;
    title: chalk.ChalkChain;
    pass: chalk.ChalkChain;
    error: chalk.ChalkChain;
    errorTitle: chalk.ChalkChain;
    errorDetail: chalk.ChalkChain;
};
