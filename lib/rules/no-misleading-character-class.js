"use strict";

/**
 * @param {string} pattern
 */
function hasMisleadingClass(pattern) {
    const idx = pattern.search(/\[\^?\]\]/u);

    return idx !== -1;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow character class syntax that is easy to misread."
        },
        schema: [],
        messages: {
            misleading: "This regular expression character class may not match what you expect."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.regex === "object" && node.regex && hasMisleadingClass(node.regex.pattern)) {
                    context.report({ node, messageId: "misleading" });
                }
            }
        };
    }
};
