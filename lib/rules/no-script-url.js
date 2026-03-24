"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow javascript: URLs."
        },
        schema: [],
        messages: {
            noScriptUrl: "Script URL is a form of eval."
        }
    },

    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return;
                }

                const v = node.value.trim().toLowerCase();

                if (v.startsWith("javascript:")) {
                    context.report({ node, messageId: "noScriptUrl" });
                }
            },
            TemplateLiteral(node) {
                if (node.quasis.length === 0) {
                    return;
                }

                const raw = node.quasis[0].value.raw;

                if (raw.trim().toLowerCase().startsWith("javascript:")) {
                    context.report({ node, messageId: "noScriptUrl" });
                }
            }
        };
    }
};
