"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow template literal placeholders in regular strings."
        },
        schema: [],
        messages: {
            templateCurly: "Template literal expression detected inside regular string."
        }
    },

    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "string" || !node.raw) {
                    return;
                }

                if (node.raw[0] === "`") {
                    return;
                }

                if (/\$\{/u.test(node.value)) {
                    context.report({ node, messageId: "templateCurly" });
                }
            }
        };
    }
};
