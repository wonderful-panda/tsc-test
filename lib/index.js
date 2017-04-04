"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript/lib/typescript");
var fs = require("fs");
var path = require("path");
var colors_1 = require("./colors");
function judge(line, expected, actual) {
    if (typeof expected === "undefined" || typeof actual === "undefined") {
        if (expected) {
            return { line: line, expected: expected, actual: actual, detail: "unexpected success" };
        }
        else if (actual) {
            return { line: line, expected: expected, actual: actual, detail: "unexpected error" };
        }
        else {
            return undefined;
        }
    }
    else if (expected.code !== actual.code) {
        return { line: line, expected: expected, actual: actual, detail: "unexpected error code" };
    }
    else if (expected.message && actual.message) {
        if (expected.message instanceof RegExp) {
            if (!expected.message.test(actual.message)) {
                return { line: line, expected: expected, actual: actual, detail: "unexpected error message" };
            }
        }
        else {
            // expected.message is string
            if (actual.message.indexOf(expected.message) < 0) {
                return { line: line, expected: expected, actual: actual, detail: "unexpected error message" };
            }
        }
    }
    return undefined;
}
function parseExpectedErrorMessage(detail) {
    if (!detail) {
        return "";
    }
    var match = /^\/(.*)\/([a-z]*)\s*$/.exec(detail);
    if (match) {
        return new RegExp(match[1], match[2]);
    }
    else {
        return detail;
    }
}
function getExpectedErrors(file) {
    var lines = fs.readFileSync(file).toString().split(/\r?\n/);
    var ret = [];
    lines.forEach(function (line, n) {
        var match = /\/\/\/\s*(TS[0-9]+)(?:\s*:\s*(.*))?$/.exec(line);
        if (match) {
            ret[n] = { code: match[1], message: parseExpectedErrorMessage(match[2]) };
        }
    });
    return ret;
}
function getActualErrors(file, service) {
    var errors = [];
    service.getSemanticDiagnostics(file).forEach(function (d) {
        var _a = d.file.getLineAndCharacterOfPosition(d.start), line = _a.line, character = _a.character;
        var message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        errors[line] = { code: "TS" + d.code, message: message };
    });
    return errors;
}
/**
 * For internal use
 */
function formatError(error, title, titleColor, detailColor) {
    var indent = "                ";
    while (indent.length < title.length) {
        indent += indent;
    }
    indent = indent.substr(0, title.length);
    var tc = titleColor || colors_1.colors.none;
    var dc = detailColor || colors_1.colors.none;
    var err = error || { code: "<no error>" };
    var text = err.message ? err.code + ": " + err.message : err.code;
    return text.replace(/^(.*)$/gm, function (_, content, offset) {
        return (offset == 0 ? tc(title) : indent) + dc(content);
    });
}
exports.formatError = formatError;
/**
 * Format failure object for pretty-print
 */
function formatFailureMessage() {
    var failures = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        failures[_i] = arguments[_i];
    }
    var ret = [];
    failures.forEach(function (failure) {
        ret.push("At line." + (failure.line + 1));
        ret.push(formatError(failure.expected, "  expected: "));
        ret.push(formatError(failure.actual, "  but was:  "));
    });
    return ret.join("\n");
}
exports.formatFailureMessage = formatFailureMessage;
/**
 * Tester object
 */
var Tester = (function () {
    function Tester(compilerOptions, sources) {
        this.compilerOptions = compilerOptions;
        this.sources = sources;
        var host = {
            getScriptFileNames: function () { return sources; },
            getScriptVersion: function (f) { return "0"; },
            getScriptSnapshot: function (f) {
                if (!fs.existsSync(f)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(f).toString());
            },
            getCurrentDirectory: function () { return process.cwd(); },
            getCompilationSettings: function () { return compilerOptions; },
            getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); },
        };
        this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
    }
    Tester.fromConfigFile = function (configPath, sources) {
        var content = fs.readFileSync(configPath).toString();
        var parsed = ts.parseJsonConfigFileContent(JSON.parse(content), ts.sys, path.dirname(configPath));
        return new Tester(parsed.options, sources || parsed.fileNames);
    };
    Tester.prototype.test = function (fileName) {
        var expectedErrors = getExpectedErrors(fileName);
        var actualErrors = getActualErrors(fileName, this.service);
        var failures = [];
        for (var i = 0; i < expectedErrors.length || i < actualErrors.length; ++i) {
            var expected = expectedErrors[i];
            var actual = actualErrors[i];
            var failure = judge(i, expected, actual);
            if (failure) {
                failures.push(failure);
            }
        }
        return failures;
    };
    Tester.prototype.testAll = function (cb) {
        var _this = this;
        var ret = true;
        this.sources.forEach(function (fileName) {
            var failures = _this.test(fileName);
            cb(fileName, failures);
            if (failures.length > 0) {
                ret = false;
            }
        });
        return ret;
    };
    return Tester;
}());
exports.Tester = Tester;
//# sourceMappingURL=index.js.map