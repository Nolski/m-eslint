"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `with` statements."
        },
        schema: [],
        messages: {
            noWith: "'with' statements are not allowed."
        }
    },

    create(context) {
        return {
            WithStatement(node) {
                context.report({
                    node,
                    messageId: "noWith"
                });
            }
        };
    }
};
