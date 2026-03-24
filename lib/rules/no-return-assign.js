"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow assignments in `return` statements."
        },
        schema: [],
        messages: {
            returnAssign: "Assignment in return statement."
        }
    },

    create(context) {
        return {
            ReturnStatement(node) {
                let arg = node.argument;

                if (!arg) {
                    return;
                }

                if (arg.type === "SequenceExpression") {
                    const last =
                        arg.expressions[arg.expressions.length - 1];

                    if (last) {
                        arg = last;
                    }
                }

                if (arg.type === "AssignmentExpression") {
                    context.report({
                        node: arg,
                        messageId: "returnAssign"
                    });
                }
            }
        };
    }
};
