"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow reassigning function parameters."
        },
        schema: [],
        messages: {
            paramReassign: "Assignment to parameter '{{name}}'."
        }
    },

    create(context) {
        /**
         * @param {object} func
         * @returns {Set<string>}
         */
        function paramNames(func) {
            const names = new Set();

            for (const p of func.params) {
                if (p.type === "Identifier") {
                    names.add(p.name);
                } else if (p.type === "AssignmentPattern" && p.left.type === "Identifier") {
                    names.add(p.left.name);
                } else if (p.type === "RestElement" && p.argument.type === "Identifier") {
                    names.add(p.argument.name);
                }
            }

            return names;
        }

        return {
            AssignmentExpression(node) {
                let current = node;

                while (current) {
                    if (
                        current.type === "FunctionDeclaration" ||
                        current.type === "FunctionExpression" ||
                        current.type === "ArrowFunctionExpression"
                    ) {
                        break;
                    }
                    current = current.parent;
                }

                if (!current) {
                    return;
                }

                const params = paramNames(current);

                if (node.left.type === "Identifier" && params.has(node.left.name)) {
                    context.report({
                        node: node.left,
                        messageId: "paramReassign",
                        data: { name: node.left.name }
                    });
                }
            },
            UpdateExpression(node) {
                if (node.argument.type !== "Identifier") {
                    return;
                }

                let current = node;

                while (current) {
                    if (
                        current.type === "FunctionDeclaration" ||
                        current.type === "FunctionExpression" ||
                        current.type === "ArrowFunctionExpression"
                    ) {
                        break;
                    }
                    current = current.parent;
                }

                if (!current) {
                    return;
                }

                const params = paramNames(current);

                if (params.has(node.argument.name)) {
                    context.report({
                        node: node.argument,
                        messageId: "paramReassign",
                        data: { name: node.argument.name }
                    });
                }
            }
        };
    }
};
