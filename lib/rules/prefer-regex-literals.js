"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer regular expression literals over the `RegExp` constructor."
        },
        schema: [],
        messages: {
            literal: "Use a regular expression literal when the pattern is static."
        }
    },
    create(context) {
        return {
            NewExpression(node) {
                if (
                    !node.callee ||
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "RegExp" ||
                    !node.arguments[0] ||
                    node.arguments[0].type !== "Literal" ||
                    typeof node.arguments[0].value !== "string"
                ) {
                    return;
                }
                context.report({ node, messageId: "literal" });
            }
        };
    }
};
