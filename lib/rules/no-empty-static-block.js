"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow empty static blocks in classes."
        },
        schema: [],
        messages: {
            empty: "Unexpected empty static block."
        }
    },
    create(context) {
        return {
            StaticBlock(node) {
                if (node.body.length === 0) {
                    context.report({ node, messageId: "empty" });
                }
            }
        };
    }
};
