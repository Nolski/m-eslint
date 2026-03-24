"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow async functions as Promise executors."
        },
        schema: [],
        messages: {
            asyncExecutor: "Promise executor should not be async."
        }
    },

    create(context) {
        return {
            NewExpression(node) {
                if (
                    !node.callee ||
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "Promise" ||
                    !node.arguments[0]
                ) {
                    return;
                }

                const arg = node.arguments[0];

                if (
                    (arg.type === "FunctionExpression" || arg.type === "ArrowFunctionExpression") &&
                    arg.async
                ) {
                    context.report({ node: arg, messageId: "asyncExecutor" });
                }
            }
        };
    }
};
