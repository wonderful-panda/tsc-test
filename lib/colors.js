"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require("chalk");
exports.colors = {
    none: function (s) { return s; },
    title: chalk.white,
    pass: chalk.bold.green,
    error: chalk.bold.red,
    errorTitle: chalk.gray,
    errorDetail: chalk.yellow,
};
//# sourceMappingURL=colors.js.map