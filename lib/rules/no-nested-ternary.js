"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow nested ternary expressions."
        },
        schema: [],
        messages: {
            noNested: "Do not nest ternary expressions."
        }
    },

    create(context) {
        return {
            ConditionalExpression(node) {
                const check = (n) => {
                    if (!n || typeof n !== "object") {
                        return false;
                    }
                    return n.type === "ConditionalExpression";
                };

                if (check(node.test) || check(node.consequent) || check(node.alternate)) {
                    context.report({ node, messageId: "noNested" });
                }
            }
        };
    }
};
