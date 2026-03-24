"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow magic numbers."
        },
        schema: [],
        messages: {
            magicNumber: "No magic number: {{raw}}."
        }
    },

    create(context) {
        const allowed = new Set([0, 1, -1, 2]);

        return {
            Literal(node) {
                if (typeof node.value !== "number" || !node.raw) {
                    return;
                }

                if (Number.isNaN(node.value) || !Number.isFinite(node.value)) {
                    return;
                }

                if (allowed.has(node.value)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "magicNumber",
                    data: { raw: node.raw }
                });
            }
        };
    }
};
