"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require constructor names to begin with a capital letter."
        },
        schema: [],
        messages: {
            lower: "A constructor name should start with an uppercase letter."
        }
    },
    create(context) {
        return {
            NewExpression(node) {
                if (!node.callee || node.callee.type !== "Identifier") {
                    return;
                }
                const name = node.callee.name;

                if (name.length && name[0] === name[0].toLowerCase()) {
                    context.report({ node: node.callee, messageId: "lower" });
                }
            }
        };
    }
};
