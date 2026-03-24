"use strict";

/**
 * @param {object} left
 * @param {object} right
 */
function sameIdentifier(left, right) {
    return left.type === "Identifier" && right.type === "Identifier" && left.name === right.name;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments where a variable is assigned to itself."
        },
        schema: [],
        messages: {
            selfAssign: "'{{name}}' is assigned to itself."
        }
    },
    create(context) {
        return {
            AssignmentExpression(node) {
                if (sameIdentifier(node.left, node.right)) {
                    context.report({
                        node,
                        messageId: "selfAssign",
                        data: { name: node.left.name }
                    });
                }
            }
        };
    }
};
