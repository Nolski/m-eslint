"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow empty destructuring patterns."
        },
        schema: [],
        messages: {
            emptyObjectPattern: "Empty object destructuring pattern.",
            emptyArrayPattern: "Empty array destructuring pattern."
        }
    },
    create(context) {
        return {
            ObjectPattern(node) {
                if (node.properties.length === 0) {
                    context.report({ node, messageId: "emptyObjectPattern" });
                }
            },
            ArrayPattern(node) {
                if (node.elements.length === 0) {
                    context.report({ node, messageId: "emptyArrayPattern" });
                }
            }
        };
    }
};
