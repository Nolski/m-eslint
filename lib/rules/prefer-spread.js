"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer the spread operator over `.apply()`."
        },
        schema: [],
        messages: {
            preferSpread: "Use the spread operator instead of .apply()."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "MemberExpression" ||
                    c.computed ||
                    !c.property ||
                    c.property.type !== "Identifier" ||
                    c.property.name !== "apply"
                ) {
                    return;
                }

                const args = node.arguments;

                if (args.length !== 2) {
                    return;
                }

                context.report({
                    node,
                    messageId: "preferSpread"
                });
            }
        };
    }
};
