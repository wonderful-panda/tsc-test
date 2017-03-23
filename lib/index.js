"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript/lib/typescript");
var fs = require("fs");
var path = require("path");
function getExpectedErrors(file) {
    var lines = fs.readFileSync(file).toString().split(/\r?\n/);
    var ret = [];
    lines.forEach(function (line, n) {
        var match = /\/\/\/\s*(TS[0-9]+)(?:\s*:\s*(.*))?$/.exec(line);
        if (match) {
            ret[n] = { line: n, code: match[1], message: new RegExp(match[2]) };
        }
    });
    return ret;
}
function getActualErrors(file, service) {
    var errors = [];
    service.getSemanticDiagnostics(file).forEach(function (d) {
        var _a = d.file.getLineAndCharacterOfPosition(d.start), line = _a.line, character = _a.character;
        var message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        errors[line] = { line: line, code: "TS" + d.code, message: message };
    });
    return errors;
}
/**
 * Format failure object for pretty-print
 */
function formatFailureMessage(failure) {
    var line = failure.line, expected = failure.expected, actual = failure.actual;
    expected = expected || { line: line, code: "<no error>" };
    actual = actual || { line: line, code: "<no error>" };
    var expectedString = expected.message ? expected.code + ": " + expected.message : expected.code;
    var actualString = actual.message ? actual.code + ": " + actual.message : actual.code;
    return ("At line " + (line + 1) + "\n-----------\n[expected]\n" + expectedString.replace(/^/gm, "  ") + "\n[actual]\n" + actualString.replace(/^/gm, "  ") + "\n");
}
exports.formatFailureMessage = formatFailureMessage;
/**
 * Tester object
 */
var Tester = (function () {
    function Tester(compilerOptions, sources, baseDir) {
        var _this = this;
        this.compilerOptions = compilerOptions;
        this.sources = sources;
        this.baseDir = baseDir || process.cwd();
        var host = {
            getScriptFileNames: function () { return sources; },
            getScriptVersion: function (f) { return "0"; },
            getScriptSnapshot: function (f) {
                if (!fs.existsSync(f)) {
                    return undefined;
                }
                return ts.ScriptSnapshot.fromString(fs.readFileSync(f).toString());
            },
            getCurrentDirectory: function () { return _this.baseDir; },
            getCompilationSettings: function () { return compilerOptions; },
            getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); },
        };
        this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
    }
    Tester.fromConfigFile = function (configPath, sources, baseDir) {
        baseDir = baseDir || path.dirname(configPath);
        var content = fs.readFileSync(configPath).toString();
        var parsed = ts.parseJsonConfigFileContent(JSON.parse(content), ts.sys, baseDir);
        return new Tester(parsed.options, sources || parsed.fileNames, baseDir);
    };
    Tester.prototype.test = function (fileName) {
        if (!path.isAbsolute(fileName)) {
            fileName = path.normalize(path.join(this.baseDir, fileName));
        }
        var expectedErrors = getExpectedErrors(fileName);
        var actualErrors = getActualErrors(fileName, this.service);
        var failures = [];
        for (var i = 0; i < expectedErrors.length || i < actualErrors.length; ++i) {
            var expected = expectedErrors[i];
            var actual = actualErrors[i];
            if (typeof expected === "undefined" || typeof actual === "undefined") {
                if (typeof expected !== typeof actual) {
                    failures.push({ line: i, expected: expected, actual: actual });
                }
            }
            else if (expected.code !== actual.code) {
                failures.push({ line: i, expected: expected, actual: actual });
            }
            else if (expected.message && actual.message && !expected.message.test(actual.message)) {
                failures.push({ line: i, expected: expected, actual: actual });
            }
        }
        return failures;
    };
    Tester.prototype.testAll = function (onFail) {
        var _this = this;
        this.sources.forEach(function (fileName) {
            var failures = _this.test(fileName);
            if (failures.length > 0) {
                onFail(fileName, failures);
            }
        });
    };
    return Tester;
}());
exports.Tester = Tester;
//# sourceMappingURL=index.js.map