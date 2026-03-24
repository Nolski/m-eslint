"use strict";

// Finding 5: Use lazy loading instead of eagerly requiring all ~270 rule modules.
// Re-export the lazy ruleCache from lib/rules/index.js which uses Object.defineProperty getters.
const ruleCache = require("./rules/index.js");

// builtinRules must be a Map (with .get(), .has(), .keys(), .values(), .entries(),
// .forEach(), Symbol.iterator, and .size) to match the real ESLint API.
const builtinRules = new Map(
    Object.keys(ruleCache).map(name => [name, ruleCache[name]])
);

/**
 * @returns {boolean}
 */
function shouldUseFlatConfig() {
    return true;
}

module.exports = {
    builtinRules,
    shouldUseFlatConfig
};
