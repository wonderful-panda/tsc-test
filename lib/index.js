"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript/lib/typescript");
var fs = require("fs");
var path = require("path");
/**
 * Judge actual error satisfies expected error or not.
 */
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
 * Format failure object for pretty-print
 */
function formatFailureMessage() {
    var failures = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        failures[_i] = arguments[_i];
    }
    var ret = [];
    failures.forEach(function (failure) {
        var line = failure.line, expected = failure.expected, actual = failure.actual;
        expected = expected || { code: "<no error>" };
        actual = actual || { code: "<no error>" };
        var expectedString = expected.message ? expected.code + ": " + expected.message : expected.code;
        var actualString = actual.message ? actual.code + ": " + actual.message : actual.code;
        ret.push("At line " + (line + 1) + "\n-----------\n[expected]\n" + expectedString.replace(/^/gm, "  ") + "\n[actual]\n" + actualString.replace(/^/gm, "  ") + "\n");
    });
    return ret.join("\n");
}
exports.formatFailureMessage = formatFailureMessage;
/**
 * Tester object
 */
var Tester = (function () {
    function Tester(compilerOptions, baseDir, sources) {
        var _this = this;
        this.compilerOptions = compilerOptions;
        this.baseDir = baseDir;
        this.sources = sources;
        var host = {
            getScriptFileNames: function () { return sources; },
            getScriptVersion: function (f) { return "0"; },
            getScriptSnapshot: function (f) {
                var filePath = path.isAbsolute(f) ? f : path.join(_this.baseDir, f);
                if (!fs.existsSync(filePath)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(filePath).toString());
            },
            getCurrentDirectory: function () { return _this.baseDir; },
            getCompilationSettings: function () { return compilerOptions; },
            getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); },
        };
        this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
    }
    Tester.fromConfigFile = function (configPath, baseDir, sources) {
        var baseDir_ = baseDir || path.dirname(configPath);
        var content = fs.readFileSync(configPath).toString();
        var parsed = ts.parseJsonConfigFileContent(JSON.parse(content), ts.sys, baseDir_);
        if (!sources) {
            sources = parsed.fileNames.map(function (fn) { return path.isAbsolute(fn) ? fn : path.relative(baseDir_, fn); });
        }
        return new Tester(parsed.options, baseDir_, sources);
    };
    Tester.prototype.test = function (fileName) {
        var filePath = path.isAbsolute(fileName) ? fileName : path.join(this.baseDir, fileName);
        var expectedErrors = getExpectedErrors(filePath);
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
        return false;
    };
    return Tester;
}());
exports.Tester = Tester;
//# sourceMappingURL=index.js.map