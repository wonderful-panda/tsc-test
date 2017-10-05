#!/usr/bin/env node

import * as meow from "meow";
import * as path from "path";
import { Tester, Failure, formatError } from "./index";
import { colors } from "./colors";

const cli = meow(
    `
    Usage
      $ tsc-test -p <project file>

    Options
      --project, -p     TypeScript configuration file
      --no-color        Disable color output

    Example
      $ tsc-test -p test/tsconfig.json
`,
    {
        string: ["project"],
        default: {
            project: "tsconfig.json"
        },
        alias: {
            p: "project"
        }
    }
);

function formatFailures(fileName: string, failures: Failure[]): string {
    const ret: string[] = [];
    failures.forEach(failure => {
        ret.push(colors.title(`${fileName}:${failure.line + 1}`));
        ret.push(
            formatError(failure.expected, "  expected: ", colors.errorTitle, colors.errorDetail)
        );
        ret.push(
            formatError(failure.actual, "  but was:  ", colors.errorTitle, colors.errorDetail)
        );
        ret.push("");
    });
    return ret.join("\n");
}

const tester = Tester.fromConfigFile(cli.flags.project);
const failureDetails: string[] = [];
const allSucceeded = tester.testAll((fileName, failures) => {
    const succeeded = failures.length === 0;
    console.info(`${succeeded ? colors.pass("OK") : colors.error("NG")}: ${fileName}`);
    if (!succeeded) {
        failureDetails.push(formatFailures(fileName, failures));
    }
});

if (allSucceeded) {
    process.exit(0);
} else {
    console.error("\n" + failureDetails.join("\n"));
    process.exit(1);
}
