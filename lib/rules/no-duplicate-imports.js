"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow importing the same module more than once."
        },
        schema: [],
        messages: {
            duplicate: "Module `{{source}}` is imported more than once."
        }
    },
    create(context) {
        const seen = new Map();

        return {
            Program() {
                seen.clear();
            },
            ImportDeclaration(node) {
                const src = node.source && node.source.value;

                if (typeof src !== "string") {
                    return;
                }
                if (seen.has(src)) {
                    context.report({
                        node,
                        messageId: "duplicate",
                        data: { source: src }
                    });
                } else {
                    seen.set(src, true);
                }
            }
        };
    }
};
