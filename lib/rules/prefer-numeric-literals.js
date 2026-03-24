"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer numeric literals over certain parse helpers."
        },
        schema: [],
        messages: {
            literal: "Use a numeric literal instead of `parseInt` with a power-of-two base."
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "parseInt" ||
                    !node.arguments[1] ||
                    node.arguments[1].type !== "Literal"
                ) {
                    return;
                }
                const base = node.arguments[1].value;

                if (base === 2 || base === 8 || base === 16) {
                    context.report({ node, messageId: "literal" });
                }
            }
        };
    }
};
