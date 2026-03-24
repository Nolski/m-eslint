"use strict";

const IRREGULAR = /[\f\v\u0085\uFEFF\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu;

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow irregular whitespace characters."
        },
        schema: [],
        messages: {
            irregularWhitespace: "Irregular whitespace detected."
        }
    },

    create(context) {
        const text = context.sourceCode.text;

        return {
            Program() {
                let m;

                IRREGULAR.lastIndex = 0;

                while ((m = IRREGULAR.exec(text)) !== null) {
                    const idx = m.index;
                    const loc = context.sourceCode.getLocFromIndex(idx);

                    context.report({
                        loc: {
                            start: loc,
                            end: { line: loc.line, column: loc.column + 1 }
                        },
                        messageId: "irregularWhitespace"
                    });
                }
            }
        };
    }
};
