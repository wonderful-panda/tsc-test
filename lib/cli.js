#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var meow = require("meow");
var index_1 = require("./index");
var colors_1 = require("./colors");
var cli = meow("\n    Usage\n      $ tsc-test -p <project file>\n\n    Options\n      --project, -p     TypeScript configuration file\n      --no-color        Disable color output\n\n    Example\n      $ tsc-test -p test/tsconfig.json\n", {
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
function formatFailures(fileName, failures) {
    var ret = [];
    failures.forEach(function (failure) {
        ret.push(colors_1.colors.title(fileName + ":" + (failure.line + 1)));
        ret.push(index_1.formatError(failure.expected, "  expected: ", colors_1.colors.errorTitle, colors_1.colors.errorDetail));
        ret.push(index_1.formatError(failure.actual, "  but was:  ", colors_1.colors.errorTitle, colors_1.colors.errorDetail));
        ret.push("");
    });
    return ret.join("\n");
}
var tester = index_1.Tester.fromConfigFile(cli.flags.project);
var failureDetails = [];
var allSucceeded = tester.testAll(function (fileName, failures) {
    var succeeded = failures.length === 0;
    console.info((succeeded ? colors_1.colors.pass("OK") : colors_1.colors.error("NG")) + ": " + fileName);
    if (!succeeded) {
        failureDetails.push(formatFailures(fileName, failures));
    }
});
if (allSucceeded) {
    process.exit(0);
}
else {
    console.error("\n" + failureDetails.join("\n"));
    process.exit(1);
}
//# sourceMappingURL=cli.js.map