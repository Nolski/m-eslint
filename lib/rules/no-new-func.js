"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the Function constructor."
        },
        schema: [],
        messages: {
            noNewFunc: "The Function constructor is a form of eval."
        }
    },

    create(context) {
        return {
            NewExpression(node) {
                if (
                    node.callee &&
                    node.callee.type === "Identifier" &&
                    node.callee.name === "Function" &&
                    context.sourceCode.isGlobalReference(node.callee)
                ) {
                    context.report({ node, messageId: "noNewFunc" });
                }
            }
        };
    }
};
