"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow throwing literals."
        },
        schema: [],
        messages: {
            throwLiteral: "Only throw Error objects."
        }
    },

    create(context) {
        return {
            ThrowStatement(node) {
                const a = node.argument;

                if (a && a.type === "Literal") {
                    context.report({
                        node: a,
                        messageId: "throwLiteral"
                    });
                }
            }
        };
    }
};
