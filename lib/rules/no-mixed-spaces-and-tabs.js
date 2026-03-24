"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow mixed spaces and tabs for indentation."
        },
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            mixedSpacesTabs: "Mixed spaces and tabs."
        }
    },

    create(context) {
        const lines = context.sourceCode.getLines();

        return {
            Program() {
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const m = /^[\t ]+/u.exec(line);

                    if (!m) {
                        continue;
                    }

                    const indent = m[0];

                    if (indent.includes("\t") && indent.includes(" ")) {
                        context.report({
                            loc: {
                                start: { line: i + 1, column: 0 },
                                end: { line: i + 1, column: indent.length }
                            },
                            messageId: "mixedSpacesTabs"
                        });
                    }
                }
            }
        };
    }
};
