"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow comments on the same line as code."
        },
        schema: [],
        messages: {
            inline: "Move this comment to its own line."
        }
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode();

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Line") {
                        continue;
                    }
                    const line = sourceCode.lines[comment.loc.start.line - 1] || "";

                    if (/^\s*\/\//u.test(line) && line.trim() !== line.trimStart()) {
                        const before = line.slice(0, comment.loc.start.column);

                        if (before.trim().length > 0) {
                            context.report({ loc: comment.loc, messageId: "inline" });
                        }
                    }
                }
            }
        };
    }
};
