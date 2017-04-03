#!/usr/bin/env node

import * as meow from "meow";
import * as path from "path";
import { Tester, formatResultForCli, Failure } from "./index";
import { colors } from "./colors";

const cli = meow(`
    Usage
      $ tsc-test -p <project file>

    Options
      --project, -p     TypeScript configuration file
      --no-color        Disable color output

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
const allSucceeded = tester.testAll((fileName, failures) => {
    const succeeded = failures.length === 0;
    console.info(`${ succeeded ? colors.pass("OK") : colors.error("NG") }: ${fileName}`);
    if (!succeeded) {
        failureDetails.push(formatResultForCli(fileName, failures));
    }
});

if (allSucceeded) {
    process.exit(0);
}
else {
    console.error("\n" + failureDetails.join("\n"));
    process.exit(1);
}


