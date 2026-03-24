"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a specific function style."
        },
        schema: [
            {
                enum: ["declaration", "expression"]
            }
        ],
        messages: {
            useDecl: "Use a function declaration instead of a function expression.",
            useExpr: "Use a function expression instead of a function declaration."
        }
    },
    create(context) {
        const style = context.options[0] || "expression";

        return {
            FunctionDeclaration(node) {
                if (style === "expression") {
                    context.report({ node, messageId: "useExpr" });
                }
            },
            VariableDeclarator(node) {
                if (style !== "declaration") {
                    return;
                }
                if (!node.init || node.init.type !== "FunctionExpression") {
                    return;
                }
                context.report({ node: node.init, messageId: "useDecl" });
            }
        };
    }
};
