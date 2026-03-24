"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow specified imported modules."
        },
        schema: [
            {
                type: "array",
                items: { type: "string" },
                uniqueItems: true
            }
        ],
        messages: {
            restricted: "Importing `{{source}}` is restricted."
        }
    },
    create(context) {
        const denied = new Set((context.options[0] || []).filter((x) => typeof x === "string"));

        if (denied.size === 0) {
            return {};
        }

        return {
            ImportDeclaration(node) {
                const src = node.source && node.source.value;

                if (typeof src === "string" && denied.has(src)) {
                    context.report({ node, messageId: "restricted", data: { source: src } });
                }
            }
        };
    }
};
