"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow labels that do not change control flow."
        },
        schema: [],
        messages: {
            extra: "This labeled statement does not wrap a loop or switch."
        }
    },
    create(context) {
        return {
            LabeledStatement(node) {
                const body = node.body;

                if (
                    body.type === "WhileStatement" ||
                    body.type === "DoWhileStatement" ||
                    body.type === "ForStatement" ||
                    body.type === "ForInStatement" ||
                    body.type === "ForOfStatement" ||
                    body.type === "SwitchStatement"
                ) {
                    return;
                }
                context.report({ node, messageId: "extra" });
            }
        };
    }
};
