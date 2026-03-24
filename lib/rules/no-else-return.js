"use strict";

/**
 * @param {object} stmt
 * @returns {boolean}
 */
function endsWithReturn(stmt) {
    if (!stmt) {
        return false;
    }

    if (stmt.type === "ReturnStatement") {
        return true;
    }

    if (stmt.type === "BlockStatement") {
        const last = stmt.body[stmt.body.length - 1];

        return Boolean(last && last.type === "ReturnStatement");
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `else` after `return`."
        },
        fixable: "code",
        schema: [],
        messages: {
            noElseReturn: "Unnecessary 'else' after 'return'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            IfStatement(node) {
                if (!node.alternate) {
                    return;
                }

                if (!endsWithReturn(node.consequent)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "noElseReturn",
                    fix(fixer) {
                        const alt = node.alternate;
                        const elseTok = sourceCode.getFirstTokenBetween(
                            node.consequent,
                            alt,
                            {
                                filter: (t) => t.value === "else"
                            }
                        );

                        if (!elseTok) {
                            return null;
                        }

                        if (alt.type === "BlockStatement") {
                            const bodyText = alt.body
                                .map((s) => sourceCode.getText(s))
                                .join("\n");

                            return fixer.replaceTextRange(
                                [elseTok.range[0], alt.range[1]],
                                bodyText
                            );
                        }

                        const altText = sourceCode.getText(alt);

                        return fixer.replaceTextRange(
                            [elseTok.range[0], alt.range[1]],
                            altText
                        );
                    }
                });
            }
        };
    }
};
