"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary `.bind()` calls."
        },
        schema: [],
        messages: {
            extra: "`.bind()` is not needed here."
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (
                    node.callee.type !== "MemberExpression" ||
                    node.callee.property.type !== "Identifier" ||
                    node.callee.property.name !== "bind" ||
                    !node.arguments[0]
                ) {
                    return;
                }
                const fn = node.callee.object;

                if (fn.type === "ArrowFunctionExpression") {
                    context.report({ node, messageId: "extra" });
                }
            }
        };
    }
};
