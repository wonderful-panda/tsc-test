import chalk from "chalk";

export const colors = {
    none: (s: string) => s,
    title: chalk.white,
    pass: chalk.bold.green,
    error: chalk.bold.red,
    errorTitle: chalk.gray,
    errorDetail: chalk.yellow
};
