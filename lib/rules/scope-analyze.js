"use strict";

const eslintScope = require("eslint-scope");
const { KEYS } = require("eslint-visitor-keys");

/**
 * @param {object} ast
 * @param {object} languageOptions
 * @returns {import("eslint-scope").ScopeManager}
 */
function analyzeScope(ast, languageOptions) {
    const opts = languageOptions || {};
    let ecmaVersion = opts.ecmaVersion;

    if (typeof ecmaVersion !== "number") {
        ecmaVersion = 2022;
    }

    let sourceType = opts.sourceType || "module";

    if (sourceType === "commonjs") {
        sourceType = "commonjs";
    } else if (sourceType !== "module" && sourceType !== "commonjs") {
        sourceType = "script";
    }

    return eslintScope.analyze(ast, {
        ecmaVersion,
        sourceType,
        childVisitorKeys: KEYS
    });
}

module.exports = {
    analyzeScope
};
