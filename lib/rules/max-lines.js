"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit the number of lines in a file."
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
            tooLong: "File has {{count}} lines; the maximum allowed is {{max}}."
        }
    },
    create(context) {
        const max = (context.options[0] && context.options[0].max) || 300;
        const sourceCode = context.sourceCode || context.getSourceCode();
        const text = sourceCode.getText();
        const count = text.split(/\r\n|\r|\n/u).length;

        return {
            Program(node) {
                if (count > max) {
                    context.report({ node, messageId: "tooLong", data: { count, max } });
                }
            }
        };
    }
};
