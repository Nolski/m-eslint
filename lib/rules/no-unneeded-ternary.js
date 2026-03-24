"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow ternary when a simpler expression exists."
        },
        fixable: "code",
        schema: [],
        messages: {
            unneededTernary: "Unnecessary use of conditional expression."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            ConditionalExpression(node) {
                const a = node.consequent;
                const b = node.alternate;

                if (
                    a.type === "Literal" &&
                    b.type === "Literal" &&
                    a.value === true &&
                    b.value === false
                ) {
                    context.report({
                        node,
                        messageId: "unneededTernary",
                        fix(fixer) {
                            return fixer.replaceText(node, `Boolean(${sourceCode.getText(node.test)})`);
                        }
                    });
                    return;
                }

                if (
                    a.type === "Literal" &&
                    b.type === "Literal" &&
                    a.value === false &&
                    b.value === true
                ) {
                    context.report({
                        node,
                        messageId: "unneededTernary",
                        fix(fixer) {
                            return fixer.replaceText(node, `!${sourceCode.getText(node.test)}`);
                        }
                    });
                    return;
                }

                if (sourceCode.getText(a) === sourceCode.getText(b)) {
                    context.report({
                        node,
                        messageId: "unneededTernary",
                        fix(fixer) {
                            return fixer.replaceText(node, sourceCode.getText(a));
                        }
                    });
                }
            }
        };
    }
};
