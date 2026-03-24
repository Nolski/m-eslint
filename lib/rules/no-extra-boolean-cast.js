"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function isBooleanContext(node) {
    const p = node.parent;

    if (!p) {
        return false;
    }

    switch (p.type) {
        case "IfStatement":
        case "ConditionalExpression":
            return p.test === node;
        case "UnaryExpression":
            return p.operator === "!" && p.argument === node;
        case "LogicalExpression":
            return p.left === node || p.right === node;
        case "WhileStatement":
        case "DoWhileStatement":
            return p.test === node;
        case "ForStatement":
            return p.test === node;
        case "CallExpression":
            return (
                p.callee.type === "Identifier" &&
                p.callee.name === "Boolean" &&
                p.arguments[0] === node
            );
        default:
            return false;
    }
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary boolean casts."
        },
        fixable: "code",
        schema: [],
        messages: {
            extraBoolCast: "Unnecessary double negation."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            UnaryExpression(node) {
                if (
                    node.operator !== "!" ||
                    !node.argument ||
                    node.argument.type !== "UnaryExpression" ||
                    node.argument.operator !== "!"
                ) {
                    return;
                }

                if (!isBooleanContext(node)) {
                    return;
                }

                const inner = node.argument.argument;

                context.report({
                    node,
                    messageId: "extraBoolCast",
                    fix(fixer) {
                        const innerText = sourceCode.getText(inner);

                        return fixer.replaceText(node, innerText);
                    }
                });
            },
            CallExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "Identifier" ||
                    c.name !== "Boolean" ||
                    node.arguments.length !== 1
                ) {
                    return;
                }

                const arg = node.arguments[0];

                if (!isBooleanContext(node)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "extraBoolCast",
                    fix(fixer) {
                        const argText = sourceCode.getText(arg);

                        return fixer.replaceText(node, argText);
                    }
                });
            }
        };
    }
};
