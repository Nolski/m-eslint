"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require logical assignment operators where possible."
        },
        schema: [],
        messages: {
            prefer: "Prefer `{{op}}=` instead of repeating the left-hand side."
        }
    },
    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.operator !== "=") {
                    return;
                }
                if (node.right.type !== "LogicalExpression") {
                    return;
                }
                const le = node.right;

                if (le.operator !== "&&" && le.operator !== "||" && le.operator !== "??") {
                    return;
                }
                if (node.left.type !== "Identifier" || le.left.type !== "Identifier") {
                    return;
                }
                if (node.left.name !== le.left.name) {
                    return;
                }
                const map = { "&&": "&&", "||": "||", "??": "??" };
                const op = map[le.operator];

                context.report({ node, messageId: "prefer", data: { op } });
            }
        };
    }
};
