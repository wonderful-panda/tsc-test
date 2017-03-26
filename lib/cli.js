#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var meow = require("meow");
var index_1 = require("./index");
var cli = meow("\n    Usage\n      $ tsc-test -p <project file>\n\n    Options\n      --project, -p     TypeScript configuration file\n\n    Example\n      $ tsc-test -p test/tsconfig.json\n", {
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
var tester = index_1.Tester.fromConfigFile(cli.flags.project);
var failureDetails = [];
var separator = "================================================================";
var allSucceeded = tester.testAll(function (fileName, failures) {
    var succeeded = failures.length === 0;
    console.info((succeeded ? "OK" : "NG") + ": " + fileName);
    if (!succeeded) {
        failureDetails.push.apply(failureDetails, ["", separator, fileName, ""].concat(failures.map(index_1.formatFailureMessage)));
    }
});
if (allSucceeded) {
    process.exit(0);
}
else {
    console.error(failureDetails.join("\n"));
    process.exit(1);
}
//# sourceMappingURL=cli.js.map