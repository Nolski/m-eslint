"use strict";

/**
 * @param {object} opts
 * @returns {{ allowShortCircuit: boolean, allowTernary: boolean, allowTaggedTemplates: boolean }}
 */
function parseOpts(opts) {
    const o = opts && typeof opts === "object" ? opts : {};

    return {
        allowShortCircuit: o.allowShortCircuit !== false,
        allowTernary: o.allowTernary !== false,
        allowTaggedTemplates: o.allowTaggedTemplates !== false
    };
}

/**
 * @param {object} node
 * @param {{ allowShortCircuit: boolean, allowTernary: boolean, allowTaggedTemplates: boolean }} opts
 * @returns {boolean}
 */
function isAllowedExpression(node, opts) {
    if (!node) {
        return false;
    }

    switch (node.type) {
        case "AssignmentExpression":
        case "AwaitExpression":
        case "CallExpression":
        case "NewExpression":
        case "UpdateExpression":
        case "YieldExpression":
            return true;
        case "SequenceExpression": {
            const last = node.expressions[node.expressions.length - 1];

            return isAllowedExpression(last, opts);
        }
        case "LogicalExpression":
            if (opts.allowShortCircuit) {
                return (
                    node.operator === "&&" ||
                    node.operator === "||" ||
                    node.operator === "??"
                );
            }

            return false;
        case "ConditionalExpression":
            return opts.allowTernary;
        case "TaggedTemplateExpression":
            return opts.allowTaggedTemplates;
        default:
            return false;
    }
}

/**
 * @param {object} node
 * @param {{ allowShortCircuit: boolean, allowTernary: boolean, allowTaggedTemplates: boolean }} opts
 * @returns {boolean}
 */
function hasSideEffects(node, opts) {
    if (!node) {
        return false;
    }

    if (isAllowedExpression(node, opts)) {
        return true;
    }

    if (node.type === "UnaryExpression" && node.operator === "delete") {
        return true;
    }

    if (node.type === "ChainExpression") {
        return hasSideEffects(node.expression, opts);
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unused expressions."
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowShortCircuit: { type: "boolean" },
                    allowTernary: { type: "boolean" },
                    allowTaggedTemplates: { type: "boolean" }
                },
                additionalProperties: false
            }
        ],
        messages: {
            unusedExpr: "Expected an assignment or function call."
        }
    },

    create(context) {
        const opts = parseOpts(context.options);

        return {
            ExpressionStatement(node) {
                if (hasSideEffects(node.expression, opts)) {
                    return;
                }

                context.report({
                    node: node.expression,
                    messageId: "unusedExpr"
                });
            }
        };
    }
};
