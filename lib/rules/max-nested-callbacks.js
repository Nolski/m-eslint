"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit how deeply callbacks can nest."
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
            deep: "Callbacks are nested {{depth}} levels deep; the maximum allowed is {{max}}."
        }
    },
    create(context) {
        const max = (context.options[0] && context.options[0].max) || 3;

        return {
            "FunctionExpression, ArrowFunctionExpression"(node) {
                let depth = 0;
                let current = node.parent;

                while (current) {
                    if (current.type === "FunctionExpression" || current.type === "ArrowFunctionExpression") {
                        depth += 1;
                    }
                    current = current.parent;
                }
                if (depth > max) {
                    context.report({ node, messageId: "deep", data: { depth, max } });
                }
            }
        };
    }
};
