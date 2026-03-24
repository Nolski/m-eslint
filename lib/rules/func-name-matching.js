"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require function names to match assigned variable names."
        },
        schema: [],
        messages: {
            mismatch: "Function name `{{fn}}` should match variable `{{var}}`."
        }
    },
    create(context) {
        return {
            VariableDeclarator(node) {
                if (
                    node.id.type !== "Identifier" ||
                    !node.init ||
                    node.init.type !== "FunctionExpression"
                ) {
                    return;
                }
                if (!node.init.id || node.init.id.name !== node.id.name) {
                    context.report({
                        node: node.init,
                        messageId: "mismatch",
                        data: {
                            fn: node.init.id ? node.init.id.name : "<anonymous>",
                            var: node.id.name
                        }
                    });
                }
            }
        };
    }
};
