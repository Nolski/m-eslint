"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce minimum and maximum identifier lengths."
        },
        schema: [
            {
                type: "object",
                properties: {
                    min: { type: "integer", minimum: 0 },
                    max: { type: "integer", minimum: 0 }
                },
                additionalProperties: false
            }
        ],
        messages: {
            tooShort: "Identifier `{{name}}` is shorter than the minimum of {{min}}.",
            tooLong: "Identifier `{{name}}` is longer than the maximum of {{max}}."
        }
    },
    create(context) {
        const opts = context.options[0] || {};
        const min = typeof opts.min === "number" ? opts.min : 2;
        const max = typeof opts.max === "number" ? opts.max : 1e9;

        return {
            Identifier(node) {
                if (node.name.length < min) {
                    context.report({ node, messageId: "tooShort", data: { name: node.name, min } });
                } else if (node.name.length > max) {
                    context.report({ node, messageId: "tooLong", data: { name: node.name, max } });
                }
            }
        };
    }
};
