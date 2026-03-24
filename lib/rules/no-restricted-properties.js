"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow certain properties on objects."
        },
        schema: [
            {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        object: { type: "string" },
                        property: { type: "string" }
                    },
                    required: ["object", "property"],
                    additionalProperties: false
                }
            }
        ],
        messages: {
            restricted: "Property `{{property}}` on `{{object}}` is restricted."
        }
    },
    create(context) {
        const list = Array.isArray(context.options[0]) ? context.options[0] : [];

        if (list.length === 0) {
            return {};
        }

        return {
            MemberExpression(node) {
                if (!node.object || node.object.type !== "Identifier" || node.property.type !== "Identifier" || node.computed) {
                    return;
                }
                const object = node.object.name;
                const property = node.property.name;

                for (const entry of list) {
                    if (entry && entry.object === object && entry.property === property) {
                        context.report({
                            node,
                            messageId: "restricted",
                            data: { object, property }
                        });
                        return;
                    }
                }
            }
        };
    }
};
