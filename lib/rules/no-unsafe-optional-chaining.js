"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow unsafe optional chaining."
        },
        schema: [],
        messages: {
            unsafeOptionalChaining: "Unsafe usage of optional chaining."
        }
    },

    create(context) {
        return {
            MemberExpression(node) {
                if (node.optional) {
                    return;
                }

                const o = node.object;

                if (o && o.type === "MemberExpression" && o.optional) {
                    context.report({ node, messageId: "unsafeOptionalChaining" });
                }
            }
        };
    }
};
