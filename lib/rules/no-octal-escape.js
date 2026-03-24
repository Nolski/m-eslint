"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow octal escape sequences in string literals."
        },
        schema: [],
        messages: {
            octal: "Octal escape sequences are not allowed."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }
                if (/\\[0-7]{1,3}/u.test(node.raw || "")) {
                    context.report({ node, messageId: "octal" });
                }
            }
        };
    }
};
