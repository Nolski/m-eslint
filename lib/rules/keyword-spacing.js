"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

const KEYWORDS = new Set([
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "try",
    "catch",
    "finally",
    "return",
    "throw",
    "case",
    "default",
    "debugger",
    "with",
    "delete",
    "void",
    "typeof",
    "instanceof",
    "in",
    "new",
    "class",
    "extends",
    "super",
    "import",
    "export",
    "from",
    "as",
    "yield",
    "await"
]);

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce spacing around keywords."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            missingBefore: "Expected space before keyword '{{keyword}}'.",
            missingAfter: "Expected space after keyword '{{keyword}}'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                const tokens = sourceCode.ast && sourceCode.ast.tokens ? sourceCode.ast.tokens : [];

                for (let i = 0; i < tokens.length; i++) {
                    const tok = tokens[i];

                    if (tok.type !== "Keyword" && !(tok.type === "Identifier" && KEYWORDS.has(tok.value))) {
                        continue;
                    }

                    if (!KEYWORDS.has(tok.value)) {
                        continue;
                    }

                    const prev = tokens[i - 1];
                    const next = tokens[i + 1];

                    if (prev && tok.loc.start.line === prev.loc.end.line) {
                        const gap = sourceCode.text.slice(prev.range[1], tok.range[0]);

                        if (gap.length > 0 && !/\s/u.test(gap)) {
                            context.report({
                                loc: tok.loc,
                                messageId: "missingBefore",
                                data: { keyword: tok.value },
                                fix(fixer) {
                                    return fixer.insertTextBefore(tok, " ");
                                }
                            });
                        }
                    }

                    if (next && tok.loc.end.line === next.loc.start.line) {
                        const gap = sourceCode.text.slice(tok.range[1], next.range[0]);

                        if (
                            gap.length > 0 &&
                            !/\s/u.test(gap) &&
                            next.value !== "(" &&
                            next.value !== ";" &&
                            next.value !== "." &&
                            next.value !== ","
                        ) {
                            context.report({
                                loc: tok.loc,
                                messageId: "missingAfter",
                                data: { keyword: tok.value },
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
