"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow division operators that look like regular expressions."
        },
        schema: [],
        messages: {
            ambiguous: "Put the regular expression on its own line to avoid looking like division."
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                if (node.operator !== "/") {
                    return;
                }
                if (
                    node.left.type === "Identifier" &&
                    node.right.type === "Identifier" &&
                    node.right.name === "g"
                ) {
                    context.report({ node, messageId: "ambiguous" });
                }
            }
        };
    }
};
