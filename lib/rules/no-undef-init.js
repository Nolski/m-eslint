"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow initializing variables to `undefined`."
        },
        schema: [],
        messages: {
            undef: "Do not initialize variables to `undefined` explicitly."
        }
    },
    create(context) {
        return {
            VariableDeclarator(node) {
                if (
                    !node.init ||
                    node.init.type !== "Identifier" ||
                    node.init.name !== "undefined"
                ) {
                    return;
                }
                context.report({ node: node.init, messageId: "undef" });
            }
        };
    }
};
