"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `eval()`."
        },
        schema: [],
        messages: {
            noEval: "eval() is not allowed."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    c &&
                    c.type === "Identifier" &&
                    c.name === "eval"
                ) {
                    context.report({
                        node,
                        messageId: "noEval"
                    });
                }
            }
        };
    }
};
