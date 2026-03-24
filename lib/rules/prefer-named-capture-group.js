"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer named capture groups in regular expressions."
        },
        schema: [],
        messages: {
            unnamed: "Use a named capture group instead of a numbered group."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.regex !== "object" || !node.regex) {
                    return;
                }
                const pattern = node.regex.pattern;

                if (/\((?!\?)/u.test(pattern)) {
                    context.report({ node, messageId: "unnamed" });
                }
            }
        };
    }
};
