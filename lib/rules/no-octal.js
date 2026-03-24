"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow legacy octal numeric literals."
        },
        schema: [],
        messages: {
            octal: "Octal literals are not allowed."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value === "number" && node.raw && /^0[0-7]+$/u.test(node.raw)) {
                    context.report({ node, messageId: "octal" });
                }
            }
        };
    }
};
