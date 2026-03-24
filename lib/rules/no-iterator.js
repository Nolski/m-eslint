"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the __iterator__ property."
        },
        schema: [],
        messages: {
            noIterator: "The '__iterator__' property is deprecated."
        }
    },

    create(context) {
        return {
            Property(node) {
                const k = node.key;

                if (
                    k &&
                    ((k.type === "Identifier" && k.name === "__iterator__") ||
                        (k.type === "Literal" && k.value === "__iterator__"))
                ) {
                    context.report({ node: k, messageId: "noIterator" });
                }
            },
            MemberExpression(node) {
                if (node.computed) {
                    if (node.property.type === "Literal" && node.property.value === "__iterator__") {
                        context.report({ node: node.property, messageId: "noIterator" });
                    }
                } else if (node.property.type === "Identifier" && node.property.name === "__iterator__") {
                    context.report({ node: node.property, messageId: "noIterator" });
                }
            }
        };
    }
};
