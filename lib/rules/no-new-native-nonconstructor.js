"use strict";

const DISALLOWED = new Set(["Symbol", "BigInt"]);

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow `new` on built-in non-constructors such as Symbol and BigInt."
        },
        schema: [],
        messages: {
            invalidNew: "`new` cannot be used with `{{name}}`."
        }
    },
    create(context) {
        return {
            NewExpression(node) {
                if (node.callee && node.callee.type === "Identifier" && DISALLOWED.has(node.callee.name)) {
                    context.report({
                        node,
                        messageId: "invalidNew",
                        data: { name: node.callee.name }
                    });
                }
            }
        };
    }
};
