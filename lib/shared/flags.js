"use strict";

const KNOWN_FLAGS = new Set();

/**
 * @param {string} flag
 * @returns {boolean}
 */
function isKnownFlag(flag) {
    return KNOWN_FLAGS.has(flag);
}

module.exports = {
    KNOWN_FLAGS,
    isKnownFlag
};
