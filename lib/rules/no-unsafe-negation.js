"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow negating the left operand of in and instanceof."
        },
        schema: [],
        messages: {
            unsafeNegation: "Unexpected negating of left operand of '{{operator}}'."
        }
    },

    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "in" && node.operator !== "instanceof") {
                    return;
                }

                if (node.left.type !== "UnaryExpression" || node.left.operator !== "!") {
                    return;
                }

                if (node.left.argument.type === "UnaryExpression" && node.left.argument.operator === "!") {
                    return;
                }

                context.report({
                    node: node.left,
                    messageId: "unsafeNegation",
                    data: { operator: node.operator }
                });
            }
        };
    }
};
