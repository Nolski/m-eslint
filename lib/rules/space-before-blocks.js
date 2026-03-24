"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce spacing before blocks."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            missingSpace: "Missing space before opening brace."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            BlockStatement(node) {
                const open = sourceCode.getFirstToken(node);

                if (!open || open.value !== "{") {
                    return;
                }

                const prev = sourceCode.getTokenBefore(open);

                if (!prev) {
                    return;
                }

                if (prev.value === ")" || prev.value === "]") {
                    const between = sourceCode.text.slice(prev.range[1], open.range[0]);

                    if (between.length > 0 && !/^\s+$/u.test(between)) {
                        return;
                    }
                    if (between === "") {
                        context.report({
                            loc: open.loc,
                            messageId: "missingSpace",
                            fix(fixer) {
                                return fixer.insertTextBefore(open, " ");
                            }
                        });
                    }
                }
            }
        };
    }
};
