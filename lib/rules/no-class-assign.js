"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow reassigning class declarations."
        },
        schema: [],
        messages: {
            classReassign: "Reassigning class '{{name}}' is not allowed."
        }
    },

    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.left.type !== "Identifier") {
                    return;
                }

                const name = node.left.name;
                let scope = node.parent;

                while (scope) {
                    if (scope.type === "ClassDeclaration" && scope.id && scope.id.name === name) {
                        context.report({
                            node: node.left,
                            messageId: "classReassign",
                            data: { name }
                        });
                        return;
                    }
                    scope = scope.parent;
                }
            }
        };
    }
};
