"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer arrow functions as callbacks."
        },
        fixable: "code",
        schema: [],
        messages: {
            preferArrow: "Use an arrow function instead of a function expression."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            CallExpression(node) {
                const args = node.arguments;

                for (const arg of args) {
                    if (arg.type !== "FunctionExpression") {
                        continue;
                    }

                    if (arg.generator || arg.async) {
                        continue;
                    }

                    context.report({
                        node: arg,
                        messageId: "preferArrow",
                        fix(fixer) {
                            const params = arg.params
                                .map((p) => sourceCode.getText(p))
                                .join(", ");
                            const bodyText = sourceCode.getText(arg.body);

                            return fixer.replaceText(
                                arg,
                                `(${params}) => ${bodyText}`
                            );
                        }
                    });
                }
            }
        };
    }
};
