"use strict";

const VALID = new Set([
    "undefined",
    "object",
    "boolean",
    "number",
    "string",
    "function",
    "symbol",
    "bigint"
]);

/**
 * @param {object} node
 */
function getTypeofSide(node) {
    if (node.type === "UnaryExpression" && node.operator === "typeof") {
        return "left";
    }

    return null;
}

/**
 * @param {object} node
 * @returns {string|null}
 */
function stringLiteralValue(node) {
    if (node.type === "Literal" && typeof node.value === "string") {
        return node.value;
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow invalid string literals in typeof comparisons."
        },
        schema: [],
        messages: {
            invalidValue: "Invalid typeof comparison value '{{value}}'."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "===" && node.operator !== "!==" && node.operator !== "==" && node.operator !== "!=") {
                    return;
                }

                let compare = null;

                if (getTypeofSide(node.left)) {
                    compare = node.right;
                } else if (getTypeofSide(node.right)) {
                    compare = node.left;
                } else {
                    return;
                }

                const val = stringLiteralValue(compare);

                if (val === null) {
                    return;
                }
                if (VALID.has(val)) {
                    return;
                }

                context.report({
                    node: compare,
                    messageId: "invalidValue",
                    data: { value: val }
                });
            }
        };
    }
};
