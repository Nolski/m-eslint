"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Discourage discarding caught error values without a named binding."
        },
        schema: [],
        messages: {
            discard: "Give the caught error a descriptive binding name instead of discarding it."
        }
    },
    create(context) {
        return {
            CatchClause(node) {
                if (!node.param) {
                    context.report({ node, messageId: "discard" });
                    return;
                }
                if (node.param.type === "Identifier" && (node.param.name === "_" || node.param.name === "ignore")) {
                    context.report({ node: node.param, messageId: "discard" });
                }
            }
        };
    }
};
