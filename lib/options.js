"use strict";

const optionator = require("optionator");

const options = optionator({
    prepend: "eslint [options] file.js [file.js ...]",
    concatRepeatedArrays: true,
    mergeRepeatedObjects: true,
    options: [
        { heading: "Basic" },
        {
            option: "help",
            alias: "h",
            type: "Boolean",
            description: "Show help"
        },
        {
            option: "version",
            alias: "v",
            type: "Boolean",
            description: "Show version number"
        },
        { heading: "Configuration" },
        {
            option: "config",
            alias: "c",
            type: "String",
            description: "Path to ESLint config file"
        },
        {
            option: "config-lookup",
            type: "Boolean",
            default: "true",
            description: "Enable or disable automatic config file discovery"
        },
        {
            option: "global",
            type: "[String]",
            description: "Define global variables (repeatable)"
        },
        {
            option: "parser",
            type: "String",
            description: "Specify a parser module"
        },
        {
            option: "parser-options",
            type: "String",
            description: "JSON parser options"
        },
        {
            option: "plugin",
            type: "[String]",
            description: "Define plugins (repeatable)"
        },
        {
            option: "rule",
            type: "[String]",
            description: "Define rules (ruleId:severity[,option])"
        },
        { heading: "Fixing" },
        {
            option: "fix",
            type: "Boolean",
            description: "Automatically fix problems"
        },
        {
            option: "fix-dry-run",
            type: "Boolean",
            description: "Show fixes without writing"
        },
        {
            option: "fix-type",
            type: "[String]",
            description: "Specify fix types to apply"
        },
        { heading: "Ignore" },
        {
            option: "ignore",
            type: "Boolean",
            default: "true",
            description: "Respect ignore patterns"
        },
        {
            option: "ignore-pattern",
            type: "[String]",
            description: "Additional ignore patterns"
        },
        { heading: "Input" },
        {
            option: "stdin",
            type: "Boolean",
            description: "Read code from stdin"
        },
        {
            option: "stdin-filename",
            type: "String",
            description: "Filename for stdin input"
        },
        {
            option: "pass-on-no-patterns",
            type: "Boolean",
            description: "Exit successfully when no file patterns are given"
        },
        {
            option: "no-error-on-unmatched-pattern",
            type: "Boolean",
            description: "Do not exit with error when a pattern matches no files"
        },
        { heading: "Output" },
        {
            option: "format",
            alias: "f",
            type: "String",
            description: "Output formatter"
        },
        {
            option: "output-file",
            alias: "o",
            type: "String",
            description: "Write output to a file"
        },
        {
            option: "color",
            type: "Boolean",
            description: "Force color output"
        },
        {
            option: "no-color",
            type: "Boolean",
            description: "Disable color output"
        },
        {
            option: "quiet",
            type: "Boolean",
            description: "Show only errors"
        },
        {
            option: "max-warnings",
            type: "Number",
            description: "Maximum number of warnings before exit code 1"
        },
        { heading: "Inline config" },
        {
            option: "no-inline-config",
            type: "Boolean",
            description: "Disallow inline configuration comments"
        },
        {
            option: "report-unused-disable-directives",
            type: "Boolean",
            description: "Report unused eslint-disable directives"
        },
        {
            option: "report-unused-disable-directives-severity",
            type: "String",
            description: "Severity for unused directive reports"
        },
        { heading: "Caching" },
        {
            option: "cache",
            type: "Boolean",
            description: "Enable caching"
        },
        {
            option: "cache-location",
            type: "String",
            description: "Path to cache file"
        },
        {
            option: "cache-strategy",
            type: "String",
            description: "Cache strategy: metadata or content"
        },
        { heading: "Misc" },
        {
            option: "init",
            type: "Boolean",
            description: "Run config initializer"
        },
        {
            option: "env-info",
            type: "Boolean",
            description: "Print environment information"
        },
        {
            option: "debug",
            type: "Boolean",
            description: "Enable debug logging"
        },
        {
            option: "exit-on-fatal-error",
            type: "Boolean",
            description: "Exit with code 2 on fatal errors"
        },
        {
            option: "stats",
            type: "Boolean",
            description: "Collect timing statistics"
        },
        {
            option: "flag",
            type: "[String]",
            description: "Define feature flags (repeatable)"
        },
        {
            option: "concurrency",
            type: "String",
            description: "Concurrency: off, auto, or a number"
        },
        {
            option: "print-config",
            type: "Boolean",
            description: "Print merged config for a file"
        }
    ]
});

/**
 * @param {string[]} argv
 * @returns {object}
 */
function parse(argv) {
    return options.parse(argv, { slice: 0 });
}

/**
 * @returns {string}
 */
function generateHelp() {
    return options.generateHelp();
}

module.exports = {
    options,
    parse,
    generateHelp
};
