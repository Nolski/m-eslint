"use strict";

/**
 * @param {object} block
 * @returns {boolean}
 */
function isDirectFunctionOrProgramBody(block) {
    const parent = block.parent;

    if (!parent) {
        return false;
    }

    if (parent.type === "Program") {
        return true;
    }

    if (
        (parent.type === "FunctionDeclaration" ||
            parent.type === "FunctionExpression" ||
            parent.type === "ArrowFunctionExpression") &&
        parent.body === block
    ) {
        return true;
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow function and var declarations in nested blocks."
        },
        schema: [
            {
                enum: ["functions", "both"]
            }
        ],
        messages: {
            innerDeclaration: "Move '{{type}}' declaration to program root or function body."
        }
    },

    create(context) {
        const mode = context.options[0] === "both" ? "both" : "functions";

        return {
            FunctionDeclaration(node) {
                let p = node.parent;

                if (p && p.type === "ExportDefaultDeclaration") {
                    p = p.parent;
                }

                if (!p || p.type !== "BlockStatement") {
                    return;
                }

                if (isDirectFunctionOrProgramBody(p)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "innerDeclaration",
                    data: { type: "function" }
                });
            },
            VariableDeclaration(node) {
                if (mode !== "both" || node.kind !== "var") {
                    return;
                }

                const p = node.parent;

                if (!p || p.type !== "BlockStatement") {
                    return;
                }

                if (isDirectFunctionOrProgramBody(p)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "innerDeclaration",
                    data: { type: "var" }
                });
            }
        };
    }
};
