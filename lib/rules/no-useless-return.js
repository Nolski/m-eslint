"use strict";

/**
 * @param {object} node
 * @returns {object|null}
 */
function getFunctionBody(node) {
    if (!node) {
        return null;
    }

    if (
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression"
    ) {
        return node.body;
    }

    if (node.type === "ArrowFunctionExpression") {
        if (node.body.type === "BlockStatement") {
            return node.body;
        }

        return null;
    }

    return null;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow redundant `return` statements."
        },
        fixable: "code",
        schema: [],
        messages: {
            uselessReturn: "Unnecessary return statement."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            ReturnStatement(node) {
                if (node.argument != null) {
                    return;
                }

                const parent = node.parent;

                if (!parent || parent.type !== "BlockStatement") {
                    return;
                }

                const last = parent.body[parent.body.length - 1];

                if (last !== node) {
                    return;
                }

                const fn = parent.parent;
                const body = getFunctionBody(fn);

                if (!body || body !== parent) {
                    return;
                }

                context.report({
                    node,
                    messageId: "uselessReturn",
                    fix(fixer) {
                        return fixer.remove(node);
                    }
                });
            }
        };
    }
};
