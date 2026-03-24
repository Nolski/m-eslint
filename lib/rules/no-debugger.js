"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow debugger statements."
        },
        schema: [],
        messages: {
            found: "'debugger' statement detected."
        }
    },
    create(context) {
        return {
            DebuggerStatement(node) {
                context.report({ node, messageId: "found" });
            }
        };
    }
};
