"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the `++` and `--` operators."
        },
        schema: [],
        messages: {
            op: "Unexpected `{{op}}` operator."
        }
    },
    create(context) {
        return {
            UpdateExpression(node) {
                if (node.operator === "++" || node.operator === "--") {
                    context.report({ node, messageId: "op", data: { op: node.operator } });
                }
            }
        };
    }
};
