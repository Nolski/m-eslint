"use strict";

const FORBIDDEN = new Set(["hasOwnProperty", "propertyIsEnumerable", "isPrototypeOf"]);

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow calling Object.prototype methods directly on objects."
        },
        schema: [],
        messages: {
            protoBuiltin: "Do not access Object.prototype method '{{method}}' directly from an object."
        }
    },

    create(context) {
        return {
            MemberExpression(node) {
                if (node.computed || !node.property || node.property.type !== "Identifier") {
                    return;
                }

                const name = node.property.name;

                if (!FORBIDDEN.has(name)) {
                    return;
                }

                if (
                    node.object.type === "MemberExpression" &&
                    !node.object.computed &&
                    node.object.object.type === "Identifier" &&
                    node.object.object.name === "Object" &&
                    node.object.property.type === "Identifier" &&
                    node.object.property.name === "prototype"
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: "protoBuiltin",
                    data: { method: name }
                });
            }
        };
    }
};
