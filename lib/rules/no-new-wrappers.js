"use strict";

const WRAPPERS = new Set(["Number", "String", "Boolean"]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow primitive wrapper constructors."
        },
        schema: [],
        messages: {
            noWrapper: "Do not use '{{constructor}}' as a constructor."
        }
    },

    create(context) {
        return {
            NewExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "Identifier" ||
                    !WRAPPERS.has(c.name)
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: "noWrapper",
                    data: { constructor: c.name }
                });
            }
        };
    }
};
