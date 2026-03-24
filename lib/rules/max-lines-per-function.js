"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit the number of lines inside a function."
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1 }
                },
                additionalProperties: false
            }
        ],
        messages: {
            tooLong: "Function body spans {{count}} lines; the maximum allowed is {{max}}."
        }
    },
    create(context) {
        const max = (context.options[0] && context.options[0].max) || 50;

        return {
            "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
                if (node.body.type !== "BlockStatement") {
                    return;
                }
                const start = node.body.loc.start.line;
                const end = node.body.loc.end.line;
                const count = end - start + 1;

                if (count > max) {
                    context.report({ node, messageId: "tooLong", data: { count, max } });
                }
            }
        };
    }
};
