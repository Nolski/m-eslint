"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow sparse arrays (array literals with holes)."
        },
        schema: [],
        messages: {
            sparseArray: "Unexpected comma in middle of array."
        }
    },
    create(context) {
        return {
            ArrayExpression(node) {
                const { elements } = node;

                for (let i = 0; i < elements.length; i++) {
                    if (elements[i] === null) {
                        context.report({ node, messageId: "sparseArray" });
                        break;
                    }
                }
            }
        };
    }
};
