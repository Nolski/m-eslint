"use strict";

/**
 * @param {object} node
 * @returns {object|null}
 */
function getConstructorMethod(node) {
    let current = node.parent;

    while (current) {
        if (current.type === "MethodDefinition" && current.kind === "constructor") {
            return current;
        }
        if (
            current.type === "FunctionExpression" &&
            current.parent &&
            current.parent.type === "MethodDefinition" &&
            current.parent.kind === "constructor"
        ) {
            return current.parent;
        }
        current = current.parent;
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow returning values from class constructors."
        },
        schema: [],
        messages: {
            badReturn: "Constructors should not return values other than `this`."
        }
    },
    create(context) {
        return {
            ReturnStatement(node) {
                const ctor = getConstructorMethod(node);

                if (!ctor) {
                    return;
                }

                if (node.argument && node.argument.type !== "ThisExpression") {
                    context.report({ node: node.argument || node, messageId: "badReturn" });
                }
            }
        };
    }
};
