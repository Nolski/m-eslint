"use strict";

/**
 * @param {object} node
 * @param {string} name
 */
function isMember(node, name) {
    return (
        node.type === "MemberExpression" &&
        !node.computed &&
        node.property.type === "Identifier" &&
        node.property.name === name
    );
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer `Object.hasOwn` over `Object.prototype.hasOwnProperty.call`."
        },
        schema: [],
        messages: {
            hasOwn: "Use `Object.hasOwn` for own property checks."
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (!isMember(node.callee, "call")) {
                    return;
                }
                const hasOwn = node.callee.object;

                if (!isMember(hasOwn, "hasOwnProperty")) {
                    return;
                }
                const prototype = hasOwn.object;

                if (!isMember(prototype, "prototype")) {
                    return;
                }
                const obj = prototype.object;

                if (obj.type !== "Identifier" || obj.name !== "Object") {
                    return;
                }
                context.report({ node, messageId: "hasOwn" });
            }
        };
    }
};
