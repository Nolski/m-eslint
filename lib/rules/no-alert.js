"use strict";

const NAMES = new Set(["alert", "confirm", "prompt"]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `alert`, `confirm`, and `prompt`."
        },
        schema: [],
        messages: {
            noAlert: "Unexpected '{{name}}'."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    c &&
                    c.type === "Identifier" &&
                    NAMES.has(c.name)
                ) {
                    context.report({
                        node: c,
                        messageId: "noAlert",
                        data: { name: c.name }
                    });
                }
            }
        };
    }
};
