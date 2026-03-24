"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a particular style for multiline comments."
        },
        schema: [
            {
                enum: ["starred-block", "separate-lines"]
            }
        ],
        messages: {
            starred: "Use a starred block comment style for multiline comments.",
            separate: "Use line comments for multiline commentary."
        }
    },
    create(context) {
        const style = context.options[0] || "starred-block";
        const sourceCode = context.sourceCode || context.getSourceCode();

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block") {
                        continue;
                    }
                    const text = comment.value;

                    if (!text.includes("\n")) {
                        continue;
                    }
                    const lines = text.split("\n");

                    if (style === "starred-block") {
                        const bad = lines.some((line) => line.trim().length > 0 && !/^\s*\*/u.test(line));

                        if (bad) {
                            context.report({ loc: comment.loc, messageId: "starred" });
                        }
                    }
                }
            }
        };
    }
};
