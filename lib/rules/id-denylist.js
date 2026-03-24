"use strict";

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeIds(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter((x) => typeof x === "string");
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow specified identifiers."
        },
        schema: [
            {
                type: "array",
                items: { type: "string" },
                uniqueItems: true
            }
        ],
        messages: {
            restricted: "Identifier `{{name}}` is not allowed."
        }
    },
    create(context) {
        const denied = new Set(normalizeIds(context.options[0]));

        return {
            Identifier(node) {
                if (denied.has(node.name)) {
                    context.report({
                        node,
                        messageId: "restricted",
                        data: { name: node.name }
                    });
                }
            }
        };
    }
};
