"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require object keys to be sorted."
        },
        schema: [],
        messages: {
            order: "Object keys are not sorted alphabetically."
        }
    },
    create(context) {
        return {
            ObjectExpression(node) {
                let last = null;

                for (const prop of node.properties) {
                    if (prop.type !== "Property" || prop.computed || prop.key.type !== "Identifier") {
                        continue;
                    }
                    const name = prop.key.name;

                    if (last !== null && name < last) {
                        context.report({ node: prop.key, messageId: "order" });
                        return;
                    }
                    last = name;
                }
            }
        };
    }
};
