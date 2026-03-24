"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a description for Symbol creation."
        },
        schema: [],
        messages: {
            missingDescription: "Symbol should have a description."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                if (
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "Symbol" ||
                    !context.sourceCode.isGlobalReference(node.callee)
                ) {
                    return;
                }

                if (node.arguments.length === 0) {
                    context.report({ node, messageId: "missingDescription" });
                    return;
                }

                const first = node.arguments[0];

                if (first.type === "Literal" && first.value === "") {
                    context.report({ node: first, messageId: "missingDescription" });
                }
            }
        };
    }
};
