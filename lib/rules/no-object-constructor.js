"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the Object constructor when creating plain objects."
        },
        schema: [],
        messages: {
            noNewObject: "Do not use `new Object()`; use an object literal instead."
        }
    },
    create(context) {
        return {
            NewExpression(node) {
                if (
                    node.callee &&
                    node.callee.type === "Identifier" &&
                    node.callee.name === "Object"
                ) {
                    context.report({ node, messageId: "noNewObject" });
                }
            }
        };
    }
};
