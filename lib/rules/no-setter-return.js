"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow returning values from setters."
        },
        schema: [],
        messages: {
            setterReturn: "Setter should not return a value."
        }
    },

    create(context) {
        return {
            ReturnStatement(node) {
                if (!node.argument) {
                    return;
                }

                let scope = node.parent;

                while (scope) {
                    if (
                        scope.type === "FunctionExpression" ||
                        scope.type === "ArrowFunctionExpression" ||
                        scope.type === "FunctionDeclaration"
                    ) {
                        break;
                    }
                    scope = scope.parent;
                }

                if (!scope || !scope.parent || scope.parent.type !== "MethodDefinition") {
                    return;
                }

                const md = scope.parent;

                if (md.kind !== "set") {
                    return;
                }

                context.report({ node, messageId: "setterReturn" });
            }
        };
    }
};
