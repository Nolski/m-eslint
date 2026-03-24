"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer the exponentiation operator over Math.pow."
        },
        fixable: "code",
        schema: [],
        messages: {
            useExponent: "Use the '**' operator instead of Math.pow."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "MemberExpression" ||
                    c.computed ||
                    c.object.type !== "Identifier" ||
                    c.object.name !== "Math" ||
                    c.property.type !== "Identifier" ||
                    c.property.name !== "pow"
                ) {
                    return;
                }

                if (node.arguments.length !== 2) {
                    return;
                }

                const [a, b] = node.arguments;

                context.report({
                    node,
                    messageId: "useExponent",
                    fix(fixer) {
                        return fixer.replaceText(
                            node,
                            `${sourceCode.getText(a)} ** ${sourceCode.getText(b)}`
                        );
                    }
                });
            }
        };
    }
};
