"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow multiline strings."
        },
        schema: [],
        messages: {
            noMultiStr: "Multiline strings are not allowed."
        }
    },

    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }

                if (!node.loc) {
                    return;
                }

                if (node.loc.start.line !== node.loc.end.line) {
                    context.report({
                        node,
                        messageId: "noMultiStr"
                    });
                }
            }
        };
    }
};
