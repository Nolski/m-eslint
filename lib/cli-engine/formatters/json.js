"use strict";

/**
 * @param {object[]} results
 * @param {object} [_data]
 * @returns {string}
 */
function format(results, _data) {
    return JSON.stringify(results);
}

module.exports = { format };
