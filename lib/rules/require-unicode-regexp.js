"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require regular expressions to include unicode mode flags."
        },
        schema: [],
        messages: {
            flag: "Add the `u` or `v` flag to this regular expression."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.regex !== "object" || !node.regex) {
                    return;
                }
                const flags = node.regex.flags || "";

                if (!flags.includes("u") && !flags.includes("v")) {
                    context.report({ node, messageId: "flag" });
                }
            }
        };
    }
};
