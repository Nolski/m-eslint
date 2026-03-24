"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a radix for `parseInt`."
        },
        hasSuggestions: true,
        schema: [],
        messages: {
            missingRadix: "Missing radix parameter.",
            addRadix: "Add radix parameter."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "Identifier" ||
                    c.name !== "parseInt"
                ) {
                    return;
                }

                if (node.arguments.length >= 2) {
                    return;
                }

                context.report({
                    node,
                    messageId: "missingRadix",
                    suggest: [
                        {
                            desc: "Add radix parameter.",
                            fix(fixer) {
                                const last = node.arguments[node.arguments.length - 1];

                                if (!last) {
                                    return null;
                                }

                                return fixer.insertTextAfter(last, ", 10");
                            }
                        }
                    ]
                });
            }
        };
    }
};
