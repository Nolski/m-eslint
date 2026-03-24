"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow literal values on the left-hand side of comparisons."
        },
        schema: [],
        messages: {
            yoda: "Literal value should appear on the right-hand side of this comparison."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "===" && node.operator !== "==" && node.operator !== "!==" && node.operator !== "!=") {
                    return;
                }
                if (node.left.type === "Literal" && node.right.type !== "Literal") {
                    context.report({ node, messageId: "yoda" });
                }
            }
        };
    }
};
