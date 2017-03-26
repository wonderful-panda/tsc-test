#!/usr/bin/env node

import * as meow from "meow";
import * as path from "path";
import { Tester, formatFailureMessage, Failure } from "./index";

const cli = meow(`
    Usage
      $ tsc-test -p <project file>

    Options
      --project, -p     TypeScript configuration file

    Example
      $ tsc-test -p test/tsconfig.json
`, {
    string: [
        "project"
    ],
    default: {
        project: "tsconfig.json"
    },
    alias: {
        p: "project"
    }
});

const tester = Tester.fromConfigFile(cli.flags.project);
const failureDetails: string[] = [];
const separator = "================================================================";
const allSucceeded = tester.testAll((fileName, failures) => {
    const succeeded = failures.length === 0;
    console.info(`${ succeeded ? "OK" : "NG" }: ${fileName}`);
    if (!succeeded) {
        failureDetails.push("", separator, fileName, "", ...failures.map(formatFailureMessage));
    }
});

if (allSucceeded) {
    process.exit(0);
}
else {
    console.error(failureDetails.join("\n"));
    process.exit(1);
}


