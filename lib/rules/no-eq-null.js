"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow loose equality comparisons with `null`."
        },
        schema: [],
        messages: {
            eqNull: "Use `===` or `!==` when comparing to `null`."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "==" && node.operator !== "!=") {
                    return;
                }
                const isNull = (n) => n.type === "Literal" && n.value === null;

                if (isNull(node.left) || isNull(node.right)) {
                    context.report({ node, messageId: "eqNull" });
                }
            }
        };
    }
};
