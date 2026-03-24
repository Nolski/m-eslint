"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow labeled statements."
        },
        schema: [],
        messages: {
            noLabel: "Labels are not allowed."
        }
    },

    create(context) {
        return {
            LabeledStatement(node) {
                context.report({
                    node,
                    messageId: "noLabel"
                });
            }
        };
    }
};
