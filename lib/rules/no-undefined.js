"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow using the `undefined` identifier."
        },
        schema: [],
        messages: {
            undef: "Unexpected use of `undefined`; use `void 0` or a local sentinel."
        }
    },
    create(context) {
        return {
            Identifier(node) {
                if (node.name !== "undefined") {
                    return;
                }
                if (node.parent && node.parent.type === "MemberExpression" && node.parent.object === node) {
                    return;
                }
                context.report({ node, messageId: "undef" });
            }
        };
    }
};
