"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a single alias name for `this`."
        },
        schema: [
            {
                type: "string"
            }
        ],
        messages: {
            badAlias: "Use `{{expected}}` as the `this` alias instead of `{{actual}}`."
        }
    },
    create(context) {
        const expected = (context.options[0] && String(context.options[0])) || "that";

        return {
            VariableDeclarator(node) {
                if (
                    node.init &&
                    node.init.type === "ThisExpression" &&
                    node.id.type === "Identifier" &&
                    node.id.name !== expected
                ) {
                    context.report({
                        node: node.id,
                        messageId: "badAlias",
                        data: { expected, actual: node.id.name }
                    });
                }
            }
        };
    }
};
