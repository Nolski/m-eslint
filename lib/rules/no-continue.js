"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `continue` statements."
        },
        schema: [],
        messages: {
            noContinue: "Unexpected `continue` statement."
        }
    },
    create(context) {
        return {
            ContinueStatement(node) {
                context.report({ node, messageId: "noContinue" });
            }
        };
    }
};
