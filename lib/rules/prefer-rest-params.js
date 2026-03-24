"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer rest parameters over `arguments`."
        },
        schema: [],
        messages: {
            preferRest: "Use rest parameters instead of 'arguments'."
        }
    },

    create(context) {
        return {
            Identifier(node) {
                if (node.name !== "arguments") {
                    return;
                }

                let cur = node.parent;

                while (cur && cur.type !== "Program") {
                    if (
                        cur.type === "FunctionDeclaration" ||
                        cur.type === "FunctionExpression"
                    ) {
                        context.report({
                            node,
                            messageId: "preferRest"
                        });

                        return;
                    }

                    if (cur.type === "ArrowFunctionExpression") {
                        return;
                    }

                    cur = cur.parent;
                }
            }
        };
    }
};
