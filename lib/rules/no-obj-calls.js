"use strict";

const FORBIDDEN = new Set(["Math", "JSON", "Reflect", "Atomics"]);

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow calling certain built-in namespace objects as functions."
        },
        schema: [],
        messages: {
            objCall: "'{{name}}' is not a function."
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                const { callee } = node;

                if (callee && callee.type === "Identifier" && FORBIDDEN.has(callee.name)) {
                    context.report({
                        node: callee,
                        messageId: "objCall",
                        data: { name: callee.name }
                    });
                }
            }
        };
    }
};
