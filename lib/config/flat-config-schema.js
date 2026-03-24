"use strict";

const { deepMerge } = require("../shared/deep-merge-arrays.js");
const { isSeverity } = require("../shared/severity.js");

const LEGACY_TOP_LEVEL_KEYS = new Set([
    "env",
    "extends",
    "root",
    "globals",
    "parserOptions"
]);

/**
 * Deep-merge `languageOptions` (recursive plain objects; arrays replaced).
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergeLanguageOptions(base, override) {
    return /** @type {object} */ (deepMerge(base, override));
}

/**
 * Merge plugin maps: later keys override earlier.
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergePlugins(base, override) {
    return { ...base, ...override };
}

/**
 * Per-rule merge: later value fully replaces earlier for each rule id.
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergeRules(base, override) {
    return { ...base, ...override };
}

/**
 * Merge rule definition maps (full rule id → implementation).
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergeRuleDefinitions(base, override) {
    return { ...base, ...override };
}

/**
 * Deep-merge settings objects.
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergeSettings(base, override) {
    return /** @type {object} */ (deepMerge(base, override));
}

/**
 * Nested merge for linterOptions (deep plain-object merge).
 * @param {object} base
 * @param {object} override
 * @returns {object}
 */
function mergeLinterOptions(base, override) {
    return /** @type {object} */ (deepMerge(base, override));
}

/**
 * Merge two flat config objects for keys that participate in composition.
 * `files`, `ignores`, and `name` are not merged here (matching / metadata only).
 *
 * @param {object} [base]
 * @param {object} [override]
 * @returns {object}
 */
function mergeConfigs(base, override) {
    const b = base && typeof base === "object" ? base : Object.create(null);
    const o = override && typeof override === "object" ? override : Object.create(null);
    const result = Object.create(null);

    if (b.languageOptions !== undefined || o.languageOptions !== undefined) {
        result.languageOptions = mergeLanguageOptions(
            b.languageOptions && typeof b.languageOptions === "object" ? b.languageOptions : Object.create(null),
            o.languageOptions && typeof o.languageOptions === "object" ? o.languageOptions : Object.create(null)
        );
    }

    if (b.plugins !== undefined || o.plugins !== undefined) {
        result.plugins = mergePlugins(
            b.plugins && typeof b.plugins === "object" ? b.plugins : Object.create(null),
            o.plugins && typeof o.plugins === "object" ? o.plugins : Object.create(null)
        );
    }

    if (b.rules !== undefined || o.rules !== undefined) {
        result.rules = mergeRules(
            b.rules && typeof b.rules === "object" && !Array.isArray(b.rules) ? b.rules : Object.create(null),
            o.rules && typeof o.rules === "object" && !Array.isArray(o.rules) ? o.rules : Object.create(null)
        );
    }

    if (b.ruleDefinitions !== undefined || o.ruleDefinitions !== undefined) {
        result.ruleDefinitions = mergeRuleDefinitions(
            b.ruleDefinitions && typeof b.ruleDefinitions === "object" && !Array.isArray(b.ruleDefinitions)
                ? b.ruleDefinitions
                : Object.create(null),
            o.ruleDefinitions && typeof o.ruleDefinitions === "object" && !Array.isArray(o.ruleDefinitions)
                ? o.ruleDefinitions
                : Object.create(null)
        );
    }

    if (b.settings !== undefined || o.settings !== undefined) {
        result.settings = mergeSettings(
            b.settings && typeof b.settings === "object" ? b.settings : Object.create(null),
            o.settings && typeof o.settings === "object" ? o.settings : Object.create(null)
        );
    }

    if (o.processor !== undefined) {
        result.processor = o.processor;
    } else if (b.processor !== undefined) {
        result.processor = b.processor;
    }

    if (o.language !== undefined) {
        result.language = o.language;
    } else if (b.language !== undefined) {
        result.language = b.language;
    }

    if (b.linterOptions !== undefined || o.linterOptions !== undefined) {
        result.linterOptions = mergeLinterOptions(
            b.linterOptions && typeof b.linterOptions === "object" ? b.linterOptions : Object.create(null),
            o.linterOptions && typeof o.linterOptions === "object" ? o.linterOptions : Object.create(null)
        );
    }

    return result;
}

/**
 * @param {unknown} severityPart
 * @returns {boolean}
 */
function isValidSeverityToken(severityPart) {
    if (typeof severityPart === "number" && isSeverity(severityPart)) {
        return true;
    }
    if (typeof severityPart === "string") {
        return (
            severityPart === "off" ||
            severityPart === "warn" ||
            severityPart === "error"
        );
    }
    return false;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidRuleConfigValue(value) {
    if (value === null || value === undefined) {
        return false;
    }
    if (typeof value === "number" || typeof value === "string") {
        return isValidSeverityToken(value);
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return false;
        }
        return isValidSeverityToken(value[0]);
    }
    if (typeof value === "object") {
        return true;
    }
    return false;
}

/**
 * @param {unknown} config
 * @throws {Error} when validation fails
 * @returns {void}
 */
function validateConfigObject(config) {
    if (config === null || typeof config !== "object" || Array.isArray(config)) {
        throw new TypeError("Config must be a non-null plain object.");
    }

    for (const key of Object.keys(config)) {
        if (LEGACY_TOP_LEVEL_KEYS.has(key)) {
            throw new Error(
                `Legacy eslintrc-style key "${key}" is not supported in flat config.`
            );
        }
    }

    if (config.rules !== undefined) {
        if (typeof config.rules !== "object" || config.rules === null || Array.isArray(config.rules)) {
            throw new TypeError('Config "rules" must be a plain object.');
        }
        for (const [ruleId, value] of Object.entries(config.rules)) {
            if (!isValidRuleConfigValue(value)) {
                throw new Error(
                    `Invalid rule configuration for "${ruleId}": severity must be 0, 1, 2, "off", "warn", or "error", or an array starting with one of those, or an object.`
                );
            }
        }
    }

    if (config.ruleDefinitions !== undefined) {
        if (
            typeof config.ruleDefinitions !== "object" ||
            config.ruleDefinitions === null ||
            Array.isArray(config.ruleDefinitions)
        ) {
            throw new TypeError('Config "ruleDefinitions" must be a plain object.');
        }
    }

    if (config.languageOptions !== undefined) {
        if (typeof config.languageOptions !== "object" || config.languageOptions === null || Array.isArray(config.languageOptions)) {
            throw new TypeError('Config "languageOptions" must be an object.');
        }
    }

    if (config.plugins !== undefined) {
        if (typeof config.plugins !== "object" || config.plugins === null || Array.isArray(config.plugins)) {
            throw new TypeError('Config "plugins" must be an object.');
        }
    }

    if (config.settings !== undefined) {
        if (typeof config.settings !== "object" || config.settings === null || Array.isArray(config.settings)) {
            throw new TypeError('Config "settings" must be an object.');
        }
    }

    if (config.linterOptions !== undefined) {
        if (typeof config.linterOptions !== "object" || config.linterOptions === null || Array.isArray(config.linterOptions)) {
            throw new TypeError('Config "linterOptions" must be an object.');
        }
    }

    if (config.files !== undefined) {
        const files = config.files;

        if (typeof files !== "string" && !Array.isArray(files)) {
            throw new TypeError('Config "files" must be a string or string array.');
        }
    }

    if (config.ignores !== undefined) {
        const ignores = config.ignores;

        if (typeof ignores !== "string" && !Array.isArray(ignores)) {
            throw new TypeError('Config "ignores" must be a string or string array.');
        }
    }
}

module.exports = {
    mergeConfigs,
    validateConfigObject
};
