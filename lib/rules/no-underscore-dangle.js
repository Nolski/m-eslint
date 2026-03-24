"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow dangling underscores in identifiers."
        },
        schema: [],
        messages: {
            dangle: "Unexpected dangling underscore in `{{name}}`."
        }
    },
    create(context) {
        return {
            Identifier(node) {
                const name = node.name;

                if (name.startsWith("_") || name.endsWith("_")) {
                    context.report({ node, messageId: "dangle", data: { name } });
                }
            }
        };
    }
};
