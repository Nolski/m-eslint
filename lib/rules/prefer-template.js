"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function exprMightBeString(node) {
    if (!node) {
        return false;
    }

    if (node.type === "Literal" && typeof node.value === "string") {
        return true;
    }

    if (node.type === "BinaryExpression" && node.operator === "+") {
        return (
            exprMightBeString(node.left) ||
            exprMightBeString(node.right)
        );
    }

    if (node.type === "TemplateLiteral") {
        return true;
    }

    return false;
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeTemplateText(s) {
    return s.replace(/\\/gu, "\\\\").replace(/`/gu, "\\`").replace(/\$\{/gu, "\\${");
}

/**
 * @param {object} node
 * @param {object} sourceCode
 * @returns {string}
 */
function toTemplateParts(node, sourceCode) {
    if (node.type === "Literal" && typeof node.value === "string") {
        return escapeTemplateText(node.value);
    }

    if (node.type === "BinaryExpression" && node.operator === "+") {
        return (
            toTemplateParts(node.left, sourceCode) +
            toTemplateParts(node.right, sourceCode)
        );
    }

    return `\${${sourceCode.getText(node)}}`;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer template literals over string concatenation."
        },
        fixable: "code",
        schema: [],
        messages: {
            preferTemplate: "Use template literals instead of string concatenation."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            BinaryExpression(node) {
                if (node.operator !== "+") {
                    return;
                }

                if (
                    !exprMightBeString(node.left) &&
                    !exprMightBeString(node.right)
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: "preferTemplate",
                    fix(fixer) {
                        const text = `\`${toTemplateParts(node, sourceCode)}\``;

                        return fixer.replaceText(node, text);
                    }
                });
            }
        };
    }
};
