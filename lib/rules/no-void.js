"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the void operator."
        },
        schema: [],
        messages: {
            noVoid: "Expected 'undefined' and instead saw 'void'."
        }
    },

    create(context) {
        return {
            UnaryExpression(node) {
                if (node.operator === "void") {
                    context.report({ node, messageId: "noVoid" });
                }
            }
        };
    }
};
