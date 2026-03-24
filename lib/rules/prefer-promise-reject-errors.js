"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require `Error` objects to be used with `Promise.reject`."
        },
        schema: [],
        messages: {
            notError: "Expected an `Error` object to be passed to `Promise.reject`."
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (
                    node.callee.type !== "MemberExpression" ||
                    node.callee.object.type !== "Identifier" ||
                    node.callee.object.name !== "Promise" ||
                    node.callee.property.type !== "Identifier" ||
                    node.callee.property.name !== "reject" ||
                    !node.arguments[0]
                ) {
                    return;
                }
                const arg = node.arguments[0];

                if (arg.type === "NewExpression") {
                    return;
                }
                context.report({ node: arg, messageId: "notError" });
            }
        };
    }
};
