"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary string concatenations."
        },
        schema: [],
        messages: {
            useless: "This concatenation is unnecessary."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "+") {
                    return;
                }
                if (node.left.type === "Literal" && node.right.type === "Literal" && typeof node.left.value === "string" && typeof node.right.value === "string") {
                    context.report({ node, messageId: "useless" });
                }
            }
        };
    }
};
