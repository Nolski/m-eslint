"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function isOnlySuperCall(node) {
    if (!node || node.type !== "BlockStatement") {
        return false;
    }

    if (node.body.length !== 1) {
        return false;
    }

    const stmt = node.body[0];

    if (!stmt || stmt.type !== "ExpressionStatement") {
        return false;
    }

    const inner = stmt.expression;

    if (!inner || inner.type !== "CallExpression") {
        return false;
    }

    const c = inner.callee;

    if (
        !c ||
        c.type !== "Super" ||
        inner.arguments.length !== 1
    ) {
        return false;
    }

    const spread = inner.arguments[0];

    if (!spread || spread.type !== "SpreadElement") {
        return false;
    }

    const arg = spread.argument;

    return (
        arg &&
        arg.type === "Identifier" &&
        arg.name === "arguments"
    );
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary constructors."
        },
        schema: [],
        messages: {
            uselessConstructor: "Unnecessary constructor."
        }
    },

    create(context) {
        return {
            MethodDefinition(node) {
                if (node.kind !== "constructor") {
                    return;
                }

                const v = node.value;

                if (!v || v.type !== "FunctionExpression") {
                    return;
                }

                if (
                    v.params.length === 0 &&
                    isOnlySuperCall(v.body)
                ) {
                    context.report({
                        node,
                        messageId: "uselessConstructor"
                    });
                }
            }
        };
    }
};
