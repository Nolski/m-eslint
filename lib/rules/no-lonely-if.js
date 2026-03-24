"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `if` as the only statement in an `else` block."
        },
        fixable: "code",
        schema: [],
        messages: {
            lonelyIf: "Unexpected if as the only statement in an else block."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            IfStatement(node) {
                const parent = node.parent;

                if (!parent || parent.type !== "BlockStatement") {
                    return;
                }

                if (parent.body.length !== 1) {
                    return;
                }

                const gp = parent.parent;

                if (!gp || gp.type !== "IfStatement") {
                    return;
                }

                if (gp.alternate !== parent) {
                    return;
                }

                context.report({
                    node,
                    messageId: "lonelyIf",
                    fix(fixer) {
                        const innerText = sourceCode.getText(node);
                        const newText = innerText.replace(
                            /^\s*if\s*/u,
                            "else if "
                        );

                        return fixer.replaceText(parent, newText);
                    }
                });
            }
        };
    }
};
