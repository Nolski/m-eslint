"use strict";

/**
 * @param {string} inner
 * @param {string} quote
 * @param {number} base
 * @param {Function} report
 */
function checkStringEscapes(inner, quote, base, report) {
    for (let i = 0; i < inner.length; i++) {
        if (inner[i] !== "\\") {
            continue;
        }

        const next = inner[i + 1];

        if (!next) {
            break;
        }

        let unnecessary = false;

        if (quote === "\"" && next === "'") {
            unnecessary = true;
        } else if (quote === "'" && next === "\"") {
            unnecessary = true;
        }

        if (unnecessary) {
            report(`\\${next}`, base + i, base + i + 2);
        }

        i += 1;
    }
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary escape characters."
        },
        schema: [],
        messages: {
            unnecessaryEscape: "Unnecessary escape character '{{character}}'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }

                const raw = sourceCode.getText(node);
                const quote = raw[0];

                if (quote !== "\"" && quote !== "'") {
                    return;
                }

                const inner = raw.slice(1, -1);

                checkStringEscapes(
                    inner,
                    quote,
                    node.range[0] + 1,
                    (ch, start, end) => {
                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(start),
                                end: sourceCode.getLocFromIndex(end)
                            },
                            messageId: "unnecessaryEscape",
                            data: { character: ch }
                        });
                    }
                );
            }
        };
    }
};
