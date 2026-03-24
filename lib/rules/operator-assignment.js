"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require operator shorthand where possible."
        },
        schema: [],
        messages: {
            shorthand: "Use `{{op}}=` instead of repeating the left-hand side."
        }
    },
    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.operator !== "=") {
                    return;
                }
                if (node.right.type !== "BinaryExpression") {
                    return;
                }
                const map = { "+": "+=", "-": "-=", "*": "*=", "/": "/=", "%": "%=", "|": "|=", "&": "&=", "^": "^=" };
                const op = node.right.operator;

                if (!map[op]) {
                    return;
                }
                if (node.left.type !== "Identifier" || node.right.left.type !== "Identifier") {
                    return;
                }
                if (node.left.name !== node.right.left.name) {
                    return;
                }
                context.report({ node, messageId: "shorthand", data: { op } });
            }
        };
    }
};
