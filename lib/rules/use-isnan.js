"use strict";

/**
 * @param {object} node
 */
function isNaNLiteral(node) {
    if (!node) {
        return false;
    }
    if (node.type === "Identifier" && node.name === "NaN") {
        return true;
    }
    if (node.type === "Literal" && Number.isNaN(node.value)) {
        return true;
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Require Number.isNaN when comparing against NaN."
        },
        schema: [],
        messages: {
            useIsNaN: "Use Number.isNaN() to compare with NaN."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "===" && node.operator !== "!==" && node.operator !== "==" && node.operator !== "!=") {
                    return;
                }
                if (isNaNLiteral(node.left) || isNaNLiteral(node.right)) {
                    context.report({ node, messageId: "useIsNaN" });
                }
            }
        };
    }
};
