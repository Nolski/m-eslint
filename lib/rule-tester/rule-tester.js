"use strict";

const assert = require("node:assert");
const { Linter } = require("../linter/linter.js");

/**
 * @param {unknown} value
 * @returns {object[]}
 */
function asConfigArray(value) {
    if (value === null || value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}

/**
 * @param {object} actual
 * @param {object} expected
 * @returns {void}
 */
function assertMessageMatches(actual, expected) {
    if (expected.message != null) {
        assert.strictEqual(actual.message, expected.message);
    }
    if (expected.messageId != null) {
        assert.strictEqual(actual.messageId, expected.messageId);
    }
    if (expected.line != null) {
        assert.strictEqual(actual.line, expected.line);
    }
    if (expected.column != null) {
        assert.strictEqual(actual.column, expected.column);
    }
    if (expected.endLine != null) {
        assert.strictEqual(actual.endLine, expected.endLine);
    }
    if (expected.endColumn != null) {
        assert.strictEqual(actual.endColumn, expected.endColumn);
    }
    if (expected.type != null) {
        assert.strictEqual(actual.nodeType || actual.type, expected.type);
    }
    if (expected.suggestions != null) {
        assert.deepStrictEqual(actual.suggestions, expected.suggestions);
    }
}

class RuleTester {
    /**
     * @param {object|object[]} [config]
     */
    constructor(config) {
        this.defaultConfig = config != null ? config : [];
    }

    /**
     * @param {string} ruleName
     * @param {object} rule
     * @param {{ valid: unknown[], invalid: unknown[] }} test
     * @returns {void}
     */
    run(ruleName, rule, test) {
        const describeFn = RuleTester.describe;
        const itFn = RuleTester.it;

        describeFn(`Rule ${ruleName}`, () => {
            function buildConfig(testCase) {
                const ruleEntry = testCase.options
                    ? ["error", ...testCase.options]
                    : "error";
                const cfg = {
                    rules: { [ruleName]: ruleEntry },
                    ruleDefinitions: { [ruleName]: rule }
                };
                if (testCase.languageOptions) {
                    cfg.languageOptions = testCase.languageOptions;
                }
                if (testCase.settings) {
                    cfg.settings = testCase.settings;
                }
                return [...asConfigArray(RuleTester._defaultConfig), ...asConfigArray(this.defaultConfig), cfg];
            }

            for (let i = 0; i < test.valid.length; i++) {
                const c = test.valid[i];

                itFn(`valid[${i}]`, () => {
                    const caseConfig = typeof c === "string" ? { code: c } : c;
                    const config = buildConfig.call(this, caseConfig);
                    const filename = caseConfig.filename || "<input>";

                    const linter = new Linter({ cwd: process.cwd() });
                    const messages = linter.verify(caseConfig.code, config, { filename });

                    assert.strictEqual(
                        messages.length,
                        0,
                        `Expected no messages, got ${JSON.stringify(messages)}`
                    );
                });
            }

            for (let i = 0; i < test.invalid.length; i++) {
                const c = test.invalid[i];

                itFn(`invalid[${i}]`, () => {
                    const caseConfig = c;
                    const config = buildConfig.call(this, caseConfig);
                    const filename = caseConfig.filename || "<input>";

                    const linter = new Linter({ cwd: process.cwd() });

                    if (Object.prototype.hasOwnProperty.call(caseConfig, "output")) {
                        const result = linter.verifyAndFix(caseConfig.code, config, { filename });
                        const messages = linter.verify(caseConfig.code, config, { filename });

                        if (caseConfig.output === null) {
                            assert.strictEqual(
                                result.output,
                                caseConfig.code,
                                "Expected no fix to be applied"
                            );
                        } else {
                            assert.strictEqual(result.output, caseConfig.output);
                        }

                        if (Array.isArray(caseConfig.errors)) {
                            assert.strictEqual(
                                messages.length,
                                caseConfig.errors.length,
                                `Expected ${caseConfig.errors.length} messages, got ${messages.length}`
                            );
                            for (let j = 0; j < caseConfig.errors.length; j++) {
                                assertMessageMatches(messages[j], caseConfig.errors[j]);
                            }
                        }
                    } else {
                        const messages = linter.verify(caseConfig.code, config, { filename });

                        if (Array.isArray(caseConfig.errors)) {
                            assert.strictEqual(
                                messages.length,
                                caseConfig.errors.length,
                                `Expected ${caseConfig.errors.length} messages, got ${messages.length}`
                            );
                            for (let j = 0; j < caseConfig.errors.length; j++) {
                                assertMessageMatches(messages[j], caseConfig.errors[j]);
                            }
                        } else if (typeof caseConfig.errors === "number") {
                            assert.strictEqual(messages.length, caseConfig.errors);
                        } else {
                            throw new TypeError("invalid case must specify errors or output");
                        }
                    }
                });
            }
        });
    }

    /**
     * @param {object|object[]} [config]
     * @returns {void}
     */
    static setDefaultConfig(config) {
        RuleTester._defaultConfig = config != null ? config : [];
    }

    /**
     * @returns {object|object[]}
     */
    static getDefaultConfig() {
        return RuleTester._defaultConfig != null ? RuleTester._defaultConfig : [];
    }

    /**
     * @returns {void}
     */
    static resetDefaultConfig() {
        RuleTester._defaultConfig = [];
    }
}

RuleTester._defaultConfig = [];

RuleTester.describe =
    typeof global !== "undefined" && typeof global.describe === "function"
        ? global.describe.bind(global)
        : function describeFallback(title, fn) {
              fn();
          };

RuleTester.it =
    typeof global !== "undefined" && typeof global.it === "function"
        ? global.it.bind(global)
        : function itFallback(title, fn) {
              fn();
          };

RuleTester.itOnly =
    typeof global !== "undefined" &&
    typeof global.it === "function" &&
    typeof global.it.only === "function"
        ? global.it.only.bind(global.it)
        : RuleTester.it;

module.exports = {
    RuleTester
};
