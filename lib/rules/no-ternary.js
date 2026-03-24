"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow ternary expressions."
        },
        schema: [],
        messages: {
            ternary: "Unexpected ternary expression."
        }
    },
    create(context) {
        return {
            ConditionalExpression(node) {
                context.report({ node, messageId: "ternary" });
            }
        };
    }
};
