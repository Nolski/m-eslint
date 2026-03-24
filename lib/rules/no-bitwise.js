"use strict";

const OPS = new Set(["|", "&", "^", "~", "<<", ">>", ">>>"]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow bitwise operators."
        },
        schema: [],
        messages: {
            noBitwise: "Unexpected use of '{{operator}}'."
        }
    },

    create(context) {
        return {
            BinaryExpression(node) {
                if (OPS.has(node.operator)) {
                    context.report({
                        node,
                        messageId: "noBitwise",
                        data: { operator: node.operator }
                    });
                }
            },
            UnaryExpression(node) {
                if (node.operator === "~") {
                    context.report({
                        node,
                        messageId: "noBitwise",
                        data: { operator: "~" }
                    });
                }
            },
            AssignmentExpression(node) {
                if (
                    ["|=", "&=", "^=", "<<=", ">>=", ">>>="].includes(node.operator)
                ) {
                    context.report({
                        node,
                        messageId: "noBitwise",
                        data: { operator: node.operator }
                    });
                }
            }
        };
    }
};
