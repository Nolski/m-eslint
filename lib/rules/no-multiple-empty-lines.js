"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow multiple empty lines."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 0 },
                    maxBOF: { type: "integer", minimum: 0 },
                    maxEOF: { type: "integer", minimum: 0 }
                },
                additionalProperties: false
            }
        ],
        messages: {
            tooManyBlankLines: "More than {{max}} blank lines not allowed."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const opts = context.options[0] && typeof context.options[0] === "object" ? context.options[0] : {};
        const max = typeof opts.max === "number" ? opts.max : 2;
        const maxBOF = typeof opts.maxBOF === "number" ? opts.maxBOF : max;
        const maxEOF = typeof opts.maxEOF === "number" ? opts.maxEOF : max;

        const lines = sourceCode.getLines();

        /**
         * @param {number} startLine 1-based
         * @param {number} endLine inclusive 1-based
         */
        function reportRange(startLine, endLine, limit) {
            if (startLine > endLine) {
                return;
            }

            const startIdx = sourceCode.getIndexFromLoc({ line: startLine, column: 0 });
            const endIdx =
                endLine < lines.length
                    ? sourceCode.getIndexFromLoc({ line: endLine + 1, column: 0 })
                    : sourceCode.text.length;

            context.report({
                loc: {
                    start: { line: startLine, column: 0 },
                    end: sourceCode.getLocFromIndex(endIdx - 1)
                },
                messageId: "tooManyBlankLines",
                data: { max: String(limit) },
                fix(fixer) {
                    return fixer.removeRange([startIdx, endIdx]);
                }
            });
        }

        return {
            Program() {
                let i = 0;

                while (i < lines.length && lines[i].trim() === "") {
                    i++;
                }

                const bofBlanks = i;

                if (bofBlanks > maxBOF && maxBOF >= 0) {
                    reportRange(maxBOF + 1, bofBlanks, maxBOF);
                }

                let blankStart = -1;

                for (; i < lines.length; i++) {
                    const blank = lines[i].trim() === "";

                    if (blank) {
                        if (blankStart < 0) {
                            blankStart = i + 1;
                        }
                    } else if (blankStart > 0) {
                        const runLen = i + 1 - blankStart;

                        if (runLen > max && max >= 0) {
                            reportRange(blankStart + max, blankStart + runLen - 1, max);
                        }
                        blankStart = -1;
                    }
                }

                if (blankStart > 0) {
                    const runLen = lines.length - blankStart + 1;

                    if (runLen > maxEOF && maxEOF >= 0) {
                        reportRange(blankStart + maxEOF, lines.length, maxEOF);
                    }
                }
            }
        };
    }
};
