"use strict";

/**
 * @param {string} pattern
 * @returns {boolean}
 */
function hasEmptyCharacterClass(pattern) {
    for (let i = 0; i < pattern.length - 1; i++) {
        if (pattern[i] === "\\") {
            i++;

            continue;
        }
        if (pattern[i] === "[" && pattern[i + 1] === "]") {
            return true;
        }
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow empty regular expression character classes."
        },
        schema: [],
        messages: {
            emptyCharClass: "Empty character class in regular expression."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (!node.regex || typeof node.regex.pattern !== "string") {
                    return;
                }
                if (hasEmptyCharacterClass(node.regex.pattern)) {
                    context.report({ node, messageId: "emptyCharClass" });
                }
            }
        };
    }
};
