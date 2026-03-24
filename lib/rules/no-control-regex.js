"use strict";

/**
 * @param {string} pattern
 * @returns {boolean}
 */
function hasUnescapedControlChar(pattern) {
    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === "\\") {
            i++;

            continue;
        }
        const code = pattern.charCodeAt(i);

        if (code <= 0x1f) {
            return true;
        }
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow ASCII control characters inside regular expression literals."
        },
        schema: [],
        messages: {
            controlChar: "Control character in regular expression."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (!node.regex || typeof node.regex.pattern !== "string") {
                    return;
                }
                if (hasUnescapedControlChar(node.regex.pattern)) {
                    context.report({ node, messageId: "controlChar" });
                }
            }
        };
    }
};
