"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow shorthand type coercions."
        },
        schema: [],
        messages: {
            plus: "Use an explicit conversion instead of unary `+`.",
            bang: "Use an explicit comparison instead of `!` coercion."
        }
    },
    create(context) {
        return {
            UnaryExpression(node) {
                if (node.operator === "+" && node.argument.type !== "Literal") {
                    context.report({ node, messageId: "plus" });
                }
                if (node.operator === "!" && node.parent && node.parent.type === "UnaryExpression" && node.parent.operator === "!") {
                    context.report({ node: node.parent, messageId: "bang" });
                }
            }
        };
    }
};
