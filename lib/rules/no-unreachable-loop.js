"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow loops with bodies that cannot repeat."
        },
        schema: [],
        messages: {
            once: "This loop body always exits on the first iteration, so the loop is unnecessary."
        }
    },
    create(context) {
        return {
            WhileStatement(node) {
                const body = node.body;

                if (body.type !== "BlockStatement" || body.body.length !== 1) {
                    return;
                }
                const only = body.body[0];

                if (only.type === "BreakStatement" || only.type === "ReturnStatement") {
                    context.report({ node, messageId: "once" });
                }
            }
        };
    }
};
