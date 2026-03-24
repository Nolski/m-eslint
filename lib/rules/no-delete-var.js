"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow deleting simple identifier references."
        },
        schema: [],
        messages: {
            deleteVar: "Variables should not be deleted."
        }
    },
    create(context) {
        return {
            UnaryExpression(node) {
                if (node.operator !== "delete") {
                    return;
                }
                if (node.argument && node.argument.type === "Identifier") {
                    context.report({ node, messageId: "deleteVar" });
                }
            }
        };
    }
};
