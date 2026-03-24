"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require `let` or `const` instead of `var`."
        },
        fixable: "code",
        schema: [],
        messages: {
            noVar: "Unexpected 'var', use 'let' or 'const' instead."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            VariableDeclaration(node) {
                if (node.kind !== "var") {
                    return;
                }

                const first = sourceCode.getFirstToken(node);

                if (!first || first.value !== "var") {
                    return;
                }

                context.report({
                    node,
                    messageId: "noVar",
                    fix(fixer) {
                        return fixer.replaceText(first, "let");
                    }
                });
            }
        };
    }
};
