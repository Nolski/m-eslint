"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require or disallow initialization in variable declarations."
        },
        schema: [
            {
                enum: ["always", "never"]
            }
        ],
        messages: {
            requireInit: "Variable `{{name}}` should be initialized in the declaration.",
            forbidInit: "Variable `{{name}}` should not be initialized in the declaration."
        }
    },
    create(context) {
        const mode = context.options[0] || "always";

        return {
            VariableDeclarator(node) {
                if (node.id.type !== "Identifier") {
                    return;
                }
                const name = node.id.name;

                if (mode === "always" && !node.init) {
                    context.report({ node, messageId: "requireInit", data: { name } });
                }
                if (mode === "never" && node.init) {
                    context.report({ node, messageId: "forbidInit", data: { name } });
                }
            }
        };
    }
};
