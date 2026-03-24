"use strict";

/**
 * @param {object[]} results
 * @param {object} [data]
 * @returns {string}
 */
function format(results, data) {
    return JSON.stringify({
        results,
        metadata: {
            rulesMeta: data && data.rulesMeta ? data.rulesMeta : {},
            cwd: data && data.cwd != null ? data.cwd : ""
        }
    });
}

module.exports = { format };
