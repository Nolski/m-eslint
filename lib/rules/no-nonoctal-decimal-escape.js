"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `\\8` and `\\9` escape sequences in string literals."
        },
        schema: [],
        messages: {
            bad: "Escape sequence `{{seq}}` is not allowed."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }
                if (/\\[89]/u.test(node.raw || "")) {
                    context.report({ node, messageId: "bad", data: { seq: "\\8 or \\9" } });
                }
            },
            TemplateLiteral(node) {
                for (const q of node.quasis) {
                    if (/\\[89]/u.test(q.value.raw)) {
                        context.report({ node: q, messageId: "bad", data: { seq: "\\8 or \\9" } });
                    }
                }
            }
        };
    }
};
