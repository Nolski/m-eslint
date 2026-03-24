"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the `__proto__` property."
        },
        schema: [],
        messages: {
            noProto: "The '__proto__' property is deprecated."
        }
    },

    create(context) {
        return {
            MemberExpression(node) {
                const p = node.property;

                if (
                    !p ||
                    p.type !== "Identifier" ||
                    p.name !== "__proto__"
                ) {
                    return;
                }

                context.report({
                    node: p,
                    messageId: "noProto"
                });
            }
        };
    }
};
