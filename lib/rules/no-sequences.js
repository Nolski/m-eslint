"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the comma operator."
        },
        schema: [],
        messages: {
            noSequence: "Unexpected use of comma operator."
        }
    },

    create(context) {
        return {
            SequenceExpression(node) {
                context.report({ node, messageId: "noSequence" });
            }
        };
    }
};
