"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow empty function bodies."
        },
        schema: [],
        messages: {
            empty: "Unexpected empty function."
        }
    },
    create(context) {
        return {
            "FunctionExpression, FunctionDeclaration, ArrowFunctionExpression"(node) {
                if (node.body.type !== "BlockStatement") {
                    return;
                }
                if (node.body.body.length === 0) {
                    context.report({ node, messageId: "empty" });
                }
            }
        };
    }
};
