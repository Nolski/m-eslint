"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow tab characters."
        },
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            noTabs: "Unexpected tab character."
        }
    },

    create(context) {
        const text = context.sourceCode.text;

        return {
            Program() {
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === "\t") {
                        const loc = context.sourceCode.getLocFromIndex(i);

                        context.report({
                            loc: {
                                start: loc,
                                end: { line: loc.line, column: loc.column + 1 }
                            },
                            messageId: "noTabs"
                        });
                    }
                }
            }
        };
    }
};
