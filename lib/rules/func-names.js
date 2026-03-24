"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require named function expressions."
        },
        schema: [],
        messages: {
            unnamed: "Unexpected unnamed function expression."
        }
    },
    create(context) {
        return {
            FunctionExpression(node) {
                if (node.id) {
                    return;
                }
                if (node.parent && node.parent.type === "VariableDeclarator") {
                    return;
                }
                context.report({ node, messageId: "unnamed" });
            }
        };
    }
};
