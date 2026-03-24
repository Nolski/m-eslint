"use strict";

/**
 * @param {object} node
 * @returns {object|null}
 */
function enclosingNonArrowFunction(node) {
    let current = node.parent;

    while (current) {
        if (current.type === "ArrowFunctionExpression") {
            current = current.parent;
            continue;
        }
        if (current.type === "FunctionExpression" || current.type === "FunctionDeclaration") {
            return current;
        }
        current = current.parent;
    }

    return null;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `this` keywords outside of functions that provide a `this` binding."
        },
        schema: [],
        messages: {
            badThis: "Unexpected `this` outside a non-arrow function."
        }
    },
    create(context) {
        return {
            ThisExpression(node) {
                if (!enclosingNonArrowFunction(node)) {
                    context.report({ node, messageId: "badThis" });
                }
            }
        };
    }
};
