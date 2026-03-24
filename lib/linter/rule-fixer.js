"use strict";

/**
 * @typedef {{ range: [number, number], text: string }} Fix
 */

/**
 * @param {{ range: [number, number] }} nodeOrToken
 * @returns {[number, number]}
 */
function getRange(nodeOrToken) {
    return nodeOrToken.range;
}

class RuleFixer {
    /**
     * @param {{ range: [number, number] }} nodeOrToken
     * @param {string} text
     * @returns {Fix}
     */
    insertTextBefore(nodeOrToken, text) {
        const start = getRange(nodeOrToken)[0];

        return { range: [start, start], text };
    }

    /**
     * @param {{ range: [number, number] }} nodeOrToken
     * @param {string} text
     * @returns {Fix}
     */
    insertTextAfter(nodeOrToken, text) {
        const end = getRange(nodeOrToken)[1];

        return { range: [end, end], text };
    }

    /**
     * @param {[number, number]} range
     * @param {string} text
     * @returns {Fix}
     */
    insertTextBeforeRange(range, text) {
        return { range: [range[0], range[0]], text };
    }

    /**
     * @param {[number, number]} range
     * @param {string} text
     * @returns {Fix}
     */
    insertTextAfterRange(range, text) {
        return { range: [range[1], range[1]], text };
    }

    /**
     * @param {{ range: [number, number] }} nodeOrToken
     * @returns {Fix}
     */
    remove(nodeOrToken) {
        return { range: getRange(nodeOrToken), text: "" };
    }

    /**
     * @param {[number, number]} range
     * @returns {Fix}
     */
    removeRange(range) {
        return { range, text: "" };
    }

    /**
     * @param {{ range: [number, number] }} nodeOrToken
     * @param {string} text
     * @returns {Fix}
     */
    replaceText(nodeOrToken, text) {
        return { range: getRange(nodeOrToken), text };
    }

    /**
     * @param {[number, number]} range
     * @param {string} text
     * @returns {Fix}
     */
    replaceTextRange(range, text) {
        return { range, text };
    }
}

/**
 * @returns {RuleFixer}
 */
function createRuleFixer() {
    return new RuleFixer();
}

module.exports = {
    RuleFixer,
    createRuleFixer
};
