"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Require or disallow a newline at the end of the file."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [
            {
                enum: ["always", "never"]
            }
        ],
        messages: {
            missingEol: "Expected newline at end of file.",
            extraEol: "Unexpected newline at end of file."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const mode = context.options[0] === "never" ? "never" : "always";

        return {
            Program(node) {
                const text = sourceCode.text;

                if (text.length === 0) {
                    if (mode === "always") {
                        context.report({
                            node,
                            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
                            messageId: "missingEol",
                            fix(fixer) {
                                return fixer.insertTextAfterRange([0, 0], "\n");
                            }
                        });
                    }
                    return;
                }

                const endsWithNewline = /(?:\r?\n|\r)$/u.test(text);

                if (mode === "always" && !endsWithNewline) {
                    context.report({
                        node,
                        loc: {
                            start: { line: node.loc.end.line, column: node.loc.end.column },
                            end: { line: node.loc.end.line, column: node.loc.end.column }
                        },
                        messageId: "missingEol",
                        fix(fixer) {
                            return fixer.insertTextAfterRange([text.length, text.length], "\n");
                        }
                    });
                } else if (mode === "never" && endsWithNewline) {
                    let trim = text.length;

                    while (trim > 0) {
                        const c = text[trim - 1];

                        if (c === "\n") {
                            trim--;
                            if (trim > 0 && text[trim - 1] === "\r") {
                                trim--;
                            }
                            continue;
                        }
                        if (c === "\r") {
                            trim--;
                            continue;
                        }
                        break;
                    }

                    const start = trim;
                    const end = text.length;

                    context.report({
                        node,
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end)
                        },
                        messageId: "extraEol",
                        fix(fixer) {
                            return fixer.removeRange([start, end]);
                        }
                    });
                }
            }
        };
    }
};
