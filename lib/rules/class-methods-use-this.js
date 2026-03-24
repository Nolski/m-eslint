"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function subtreeUsesThis(node) {
    if (!node) {
        return false;
    }
    if (node.type === "ThisExpression") {
        return true;
    }
    for (const key of Object.keys(node)) {
        if (key === "parent") {
            continue;
        }
        const v = node[key];

        if (Array.isArray(v)) {
            for (const c of v) {
                if (subtreeUsesThis(c)) {
                    return true;
                }
            }
        } else if (v && typeof v === "object") {
            if (subtreeUsesThis(v)) {
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce that class methods use `this` or are static."
        },
        schema: [],
        messages: {
            unusedThis: "Class method `{{name}}` does not use `this`; consider making it static."
        }
    },
    create(context) {
        return {
            "MethodDefinition[kind='method']"(node) {
                if (node.static || node.key.type === "PrivateIdentifier") {
                    return;
                }
                const fn = node.value;

                if (fn.type !== "FunctionExpression") {
                    return;
                }
                if (subtreeUsesThis(fn.body)) {
                    return;
                }
                const name = node.key.type === "Identifier" ? node.key.name : "method";

                context.report({ node, messageId: "unusedThis", data: { name } });
            }
        };
    }
};
