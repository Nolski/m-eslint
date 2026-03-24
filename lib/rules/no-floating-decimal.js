"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow floating decimal literals that omit a leading digit."
        },
        schema: [],
        messages: {
            float: "Include a leading zero before the decimal point for clarity."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "number" || !node.raw) {
                    return;
                }
                if (node.raw.startsWith(".")) {
                    context.report({ node, messageId: "float" });
                }
            }
        };
    }
};
