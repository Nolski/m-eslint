"use strict";

/**
 * @param {object} a
 * @param {object} b
 */
function sameReference(a, b) {
    if (a.type !== b.type) {
        return false;
    }
    if (a.type === "Identifier") {
        return a.name === b.name;
    }
    if (a.type === "MemberExpression" && !a.computed) {
        return (
            sameReference(a.object, b.object) &&
            a.property.type === "Identifier" &&
            b.property.type === "Identifier" &&
            a.property.name === b.property.name
        );
    }
    if (a.type === "ThisExpression" && b.type === "ThisExpression") {
        return true;
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow comparisons where both sides are the same expression."
        },
        schema: [],
        messages: {
            selfCompare: "Comparing an expression to itself is always {{result}}."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "===" && node.operator !== "==" && node.operator !== "!==") {
                    return;
                }
                if (!sameReference(node.left, node.right)) {
                    return;
                }
                const result = node.operator === "!==" ? "true" : "predictable";

                context.report({
                    node,
                    messageId: "selfCompare",
                    data: { result }
                });
            }
        };
    }
};
