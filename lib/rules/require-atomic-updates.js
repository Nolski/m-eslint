"use strict";

/**
 * @param {object} node
 * @param {string} name
 * @returns {boolean}
 */
function containsIdentifier(node, name) {
    if (!node) {
        return false;
    }
    if (node.type === "Identifier") {
        return node.name === name;
    }
    if (node.type === "MemberExpression") {
        return containsIdentifier(node.object, name) || containsIdentifier(node.property, name);
    }
    if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
        return containsIdentifier(node.left, name) || containsIdentifier(node.right, name);
    }
    if (node.type === "UnaryExpression" || node.type === "UpdateExpression") {
        return containsIdentifier(node.argument, name);
    }
    if (node.type === "ConditionalExpression") {
        return (
            containsIdentifier(node.test, name) ||
            containsIdentifier(node.consequent, name) ||
            containsIdentifier(node.alternate, name)
        );
    }
    if (node.type === "CallExpression") {
        if (containsIdentifier(node.callee, name)) {
            return true;
        }
        return node.arguments.some((a) => containsIdentifier(a, name));
    }
    if (node.type === "AwaitExpression") {
        return containsIdentifier(node.argument, name);
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments where async operations may interleave unexpectedly."
        },
        schema: [],
        messages: {
            race: "The variable `{{name}}` is updated using a value that may depend on its previous state across an `await`."
        }
    },
    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.left.type !== "Identifier") {
                    return;
                }
                if (node.right.type !== "AwaitExpression") {
                    return;
                }
                const name = node.left.name;

                if (containsIdentifier(node.right.argument, name)) {
                    context.report({
                        node,
                        messageId: "race",
                        data: { name }
                    });
                }
            }
        };
    }
};
