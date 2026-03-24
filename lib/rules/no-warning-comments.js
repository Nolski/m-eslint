"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow warning words in comments."
        },
        schema: [],
        messages: {
            warn: "Comment contains a warning marker: {{word}}."
        }
    },
    create(context) {
        const words = ["TODO", "FIXME", "XXX", "HACK"];
        const sourceCode = context.sourceCode || context.getSourceCode();

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    const text = comment.value.toUpperCase();

                    for (const word of words) {
                        if (text.includes(word)) {
                            context.report({
                                loc: comment.loc,
                                messageId: "warn",
                                data: { word }
                            });
                            break;
                        }
                    }
                }
            }
        };
    }
};
