"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require variables in the same declaration to be sorted."
        },
        schema: [],
        messages: {
            order: "Variable names in this declaration are not sorted alphabetically."
        }
    },
    create(context) {
        return {
            VariableDeclaration(node) {
                if (node.declarations.length < 2) {
                    return;
                }
                let last = null;

                for (const d of node.declarations) {
                    if (d.id.type !== "Identifier") {
                        continue;
                    }
                    const name = d.id.name;

                    if (last !== null && name < last) {
                        context.report({ node: d.id, messageId: "order" });
                        return;
                    }
                    last = name;
                }
            }
        };
    }
};
