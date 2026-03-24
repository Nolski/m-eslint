"use strict";

const { Linter, SourceCode } = require("./linter/linter.js");
const { ESLint } = require("./eslint/eslint.js");
const { RuleTester } = require("./rule-tester/rule-tester.js");

/**
 * @returns {Promise<typeof ESLint>}
 */
function loadESLint() {
    return Promise.resolve(ESLint);
}

module.exports = {
    ESLint,
    Linter,
    RuleTester,
    SourceCode,
    loadESLint
};
