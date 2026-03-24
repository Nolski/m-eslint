"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a naming pattern for identifiers."
        },
        schema: [
            {
                type: "string"
            }
        ],
        messages: {
            pattern: "Identifier `{{name}}` does not match the required pattern."
        }
    },
    create(context) {
        const raw = context.options[0];

        if (!raw || typeof raw !== "string") {
            return {};
        }
        let pattern;

        try {
            pattern = new RegExp(raw, "u");
        } catch {
            return {};
        }

        return {
            Identifier(node) {
                if (!pattern.test(node.name)) {
                    context.report({ node, messageId: "pattern", data: { name: node.name } });
                }
            }
        };
    }
};
