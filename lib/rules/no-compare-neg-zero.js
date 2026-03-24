"use strict";

/**
 * @param {object} node
 */
function isNegativeZero(node) {
    return (
        node &&
        node.type === "UnaryExpression" &&
        node.operator === "-" &&
        node.argument &&
        node.argument.type === "Literal" &&
        node.argument.value === 0
    );
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow comparisons that target negative zero explicitly."
        },
        schema: [],
        messages: {
            negZero: "Avoid comparing directly to negative zero."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "===" && node.operator !== "!==" && node.operator !== "==" && node.operator !== "!=") {
                    return;
                }
                if (isNegativeZero(node.left) || isNegativeZero(node.right)) {
                    context.report({ node, messageId: "negZero" });
                }
            }
        };
    }
};
