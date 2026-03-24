"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary computed property names."
        },
        schema: [],
        messages: {
            useless: "Computed key is unnecessary for this identifier."
        }
    },
    create(context) {
        return {
            Property(node) {
                if (!node.computed || node.key.type !== "Literal") {
                    return;
                }
                if (typeof node.key.value !== "string") {
                    return;
                }
                if (/^[a-zA-Z_$][\w$]*$/u.test(node.key.value)) {
                    context.report({ node: node.key, messageId: "useless" });
                }
            }
        };
    }
};
