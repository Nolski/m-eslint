"use strict";

const { computeLineDepths } = require("../native-binding.js");

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce consistent indentation."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [
            {
                oneOf: [{ type: "integer", minimum: 1 }, { enum: ["tab"] }]
            }
        ],
        messages: {
            wrongIndent: "Expected indentation of {{expected}} but found {{actual}}."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const text = sourceCode.text;
        const opt = context.options[0];
        const useTab = opt === "tab";
        const width = typeof opt === "number" ? opt : 4;

        const lines = sourceCode.getLines();
        const tokens = sourceCode.ast && sourceCode.ast.tokens ? sourceCode.ast.tokens : [];

        /** @type {Map<number, object>} */
        const firstTokenByLine = new Map();

        for (const tok of tokens) {
            if (!tok || !tok.loc) {
                continue;
            }
            const line = tok.loc.start.line;

            if (!firstTokenByLine.has(line)) {
                firstTokenByLine.set(line, tok);
            }
        }

        // O(n) single-pass depth computation via Rust native binding
        const lineDepths = computeLineDepths(text);

        return {
            Program() {
                for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
                    const line = lines[lineNum - 1];
                    const firstTok = firstTokenByLine.get(lineNum);

                    if (!firstTok) {
                        continue;
                    }

                    const col = firstTok.loc.start.column;

                    if (col === 0) {
                        continue;
                    }

                    const depth = lineDepths[lineNum - 1] || 0;
                    const expectedPrefix = useTab ? "\t".repeat(depth) : " ".repeat(depth * width);
                    const actualPrefix = line.slice(0, col);

                    if (actualPrefix !== expectedPrefix) {
                        context.report({
                            loc: {
                                start: { line: lineNum, column: 0 },
                                end: { line: lineNum, column: col }
                            },
                            messageId: "wrongIndent",
                            data: {
                                expected: JSON.stringify(expectedPrefix),
                                actual: JSON.stringify(actualPrefix)
                            },
                            fix(fixer) {
                                const rangeStart = sourceCode.getIndexFromLoc({ line: lineNum, column: 0 });
                                const rangeEnd = sourceCode.getIndexFromLoc({ line: lineNum, column });

                                return fixer.replaceTextRange([rangeStart, rangeEnd], expectedPrefix);
                            }
                        });
                    }
                }
            }
        };
    }
};
