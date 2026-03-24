"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce default parameters to appear last."
        },
        schema: [],
        messages: {
            order: "Parameters with defaults must appear after those without defaults."
        }
    },
    create(context) {
        return {
            "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
                let seenDefault = false;

                for (const param of node.params) {
                    const hasDefault = param.type === "AssignmentPattern";

                    if (hasDefault) {
                        seenDefault = true;
                    } else if (seenDefault) {
                        context.report({ node: param, messageId: "order" });
                        return;
                    }
                }
            }
        };
    }
};
