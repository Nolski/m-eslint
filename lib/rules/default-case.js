"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a default case in switch statements."
        },
        schema: [],
        messages: {
            missingDefault: "Expected a default case."
        }
    },

    create(context) {
        return {
            SwitchStatement(node) {
                const hasDefault = node.cases.some((c) => c.test === null);

                if (!hasDefault) {
                    context.report({ node, messageId: "missingDefault" });
                }
            }
        };
    }
};
