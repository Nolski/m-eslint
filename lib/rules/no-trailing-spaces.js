"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow trailing whitespace."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            trailingSpace: "Trailing whitespace detected."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const lines = sourceCode.getLines();

        return {
            Program() {
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const m = /[ \t]+$/u.exec(line);

                    if (!m) {
                        continue;
                    }

                    const lineNum = i + 1;
                    const wsStart = line.length - m[0].length;
                    const start = sourceCode.getIndexFromLoc({ line: lineNum, column: wsStart });
                    const end = sourceCode.getIndexFromLoc({ line: lineNum, column: line.length });

                    context.report({
                        loc: {
                            start: { line: lineNum, column: wsStart },
                            end: { line: lineNum, column: line.length }
                        },
                        messageId: "trailingSpace",
                        fix(fixer) {
                            return fixer.removeRange([start, end]);
                        }
                    });
                }
            }
        };
    }
};
