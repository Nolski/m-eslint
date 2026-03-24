"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce spacing around commas."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            missingAfter: "Expected space after comma.",
            unexpectedBefore: "Unexpected space before comma."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                const tokens = sourceCode.ast && sourceCode.ast.tokens ? sourceCode.ast.tokens : [];

                for (let i = 0; i < tokens.length; i++) {
                    const tok = tokens[i];

                    if (tok.type !== "Punctuator" || tok.value !== ",") {
                        continue;
                    }

                    const prev = tokens[i - 1];
                    const next = tokens[i + 1];

                    if (prev && tok.loc.start.line === prev.loc.end.line) {
                        const gap = sourceCode.text.slice(prev.range[1], tok.range[0]);

                        if (/\s/u.test(gap)) {
                            context.report({
                                loc: tok.loc,
                                messageId: "unexpectedBefore",
                                fix(fixer) {
                                    return fixer.replaceTextRange([prev.range[1], tok.range[0]], "");
                                }
                            });
                        }
                    }

                    if (
                        next &&
                        tok.loc.end.line === next.loc.start.line &&
                        next.value !== ")" &&
                        next.value !== "]" &&
                        next.value !== "}"
                    ) {
                        const gap = sourceCode.text.slice(tok.range[1], next.range[0]);

                        if (gap.length > 0 && !/\s/u.test(gap)) {
                            context.report({
                                loc: tok.loc,
                                messageId: "missingAfter",
                                fix(fixer) {
                                    return fixer.insertTextAfter(tok, " ");
                                }
                            });
                        }
                    }
                }
            }
        };
    }
};
