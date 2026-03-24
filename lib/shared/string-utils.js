"use strict";

/**
 * @param {string} str
 * @returns {string}
 */
function upperCaseFirst(str) {
    if (str.length === 0) {
        return str;
    }
    return str[0].toUpperCase() + str.slice(1);
}

/**
 * @param {string} str
 * @returns {string}
 */
function kebabCase(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
}

module.exports = { upperCaseFirst, kebabCase };
