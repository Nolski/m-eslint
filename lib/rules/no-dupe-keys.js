"use strict";

/**
 * @param {object} keyNode
 * @returns {string|null}
 */
function staticKeyName(keyNode) {
    if (!keyNode) {
        return null;
    }
    if (keyNode.type === "Identifier") {
        return keyNode.name;
    }
    if (keyNode.type === "Literal") {
        return String(keyNode.value);
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow duplicate keys in object literals."
        },
        schema: [],
        messages: {
            duplicateKey: "Duplicate key '{{keyName}}' found in object."
        }
    },
    create(context) {
        return {
            ObjectExpression(node) {
                const seen = new Map();

                for (const prop of node.properties) {
                    if (prop.type !== "Property" || prop.computed) {
                        continue;
                    }
                    const name = staticKeyName(prop.key);

                    if (name === null) {
                        continue;
                    }
                    if (seen.has(name)) {
                        context.report({
                            node: prop,
                            messageId: "duplicateKey",
                            data: { keyName: name }
                        });
                    } else {
                        seen.set(name, prop);
                    }
                }
            }
        };
    }
};
