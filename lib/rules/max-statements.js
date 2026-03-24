"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit the number of statements per function."
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 0 }
                },
                additionalProperties: false
            }
        ],
        messages: {
            tooMany: "Function contains {{count}} statements; the maximum allowed is {{max}}."
        }
    },
    create(context) {
        const max = (context.options[0] && context.options[0].max) || 20;

        return {
            "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
                if (node.body.type !== "BlockStatement") {
                    return;
                }
                const count = node.body.body.length;

                if (count > max) {
                    context.report({ node, messageId: "tooMany", data: { count, max } });
                }
            }
        };
    }
};
