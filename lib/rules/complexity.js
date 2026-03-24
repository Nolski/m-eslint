"use strict";

const { getKeys } = require("eslint-visitor-keys");

/**
 * @param {unknown} raw
 * @returns {number}
 */
function getMax(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return raw;
    }

    if (
        raw &&
        typeof raw === "object" &&
        typeof raw.max === "number" &&
        Number.isFinite(raw.max)
    ) {
        return raw.max;
    }

    return 20;
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isFunctionNode(node) {
    return (
        node &&
        (node.type === "FunctionDeclaration" ||
            node.type === "FunctionExpression" ||
            node.type === "ArrowFunctionExpression")
    );
}

/**
 * @param {object} fn
 * @returns {number}
 */
function measureComplexity(fn) {
    let complexity = 1;

    /**
     * @param {object} node
     * @param {boolean} skipFnBoundary
     */
    function walk(node, skipFnBoundary) {
        if (!node || typeof node !== "object") {
            return;
        }

        if (skipFnBoundary && isFunctionNode(node) && node !== fn) {
            return;
        }

        switch (node.type) {
            case "IfStatement":
                complexity += 1;
                break;
            case "ConditionalExpression":
                complexity += 1;
                break;
            case "LogicalExpression":
                if (
                    node.operator === "&&" ||
                    node.operator === "||" ||
                    node.operator === "??"
                ) {
                    complexity += 1;
                }
                break;
            case "SwitchCase":
                if (node.test) {
                    complexity += 1;
                }
                break;
            case "CatchClause":
                complexity += 1;
                break;
            case "ForStatement":
            case "ForInStatement":
            case "ForOfStatement":
            case "WhileStatement":
            case "DoWhileStatement":
                complexity += 1;
                break;
            default:
                break;
        }

        const keys = getKeys(node);

        for (const key of keys) {
            const v = node[key];

            if (key === "parent") {
                continue;
            }

            if (Array.isArray(v)) {
                for (const c of v) {
                    walk(c, true);
                }
            } else if (v && typeof v === "object" && v.type) {
                walk(v, true);
            }
        }
    }

    walk(fn, false);

    return complexity;
}

/**
 * @param {object} node
 * @returns {string}
 */
function getFunctionName(node) {
    if (!node) {
        return "<anonymous>";
    }

    if (node.type === "FunctionDeclaration" && node.id) {
        return node.id.name;
    }

    if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        const p = node.parent;

        if (
            p &&
            p.type === "VariableDeclarator" &&
            p.id.type === "Identifier"
        ) {
            return p.id.name;
        }

        if (
            p &&
            p.type === "Property" &&
            !p.computed &&
            p.key.type === "Identifier"
        ) {
            return p.key.name;
        }

        if (
            p &&
            p.type === "MethodDefinition" &&
            p.key.type === "Identifier"
        ) {
            return p.key.name;
        }
    }

    return "<anonymous>";
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit cyclomatic complexity."
        },
        schema: [
            {
                anyOf: [
                    { type: "number", minimum: 0 },
                    {
                        type: "object",
                        properties: {
                            max: { type: "number", minimum: 0 }
                        },
                        additionalProperties: false
                    }
                ]
            }
        ],
        messages: {
            tooComplex:
                "Function '{{name}}' has a complexity of {{complexity}}. Maximum is {{max}}."
        }
    },

    create(context) {
        const max = getMax(context.options);

        /**
         * @param {object} fn
         */
        function check(fn) {
            const complexity = measureComplexity(fn);

            if (complexity > max) {
                context.report({
                    node: fn,
                    messageId: "tooComplex",
                    data: {
                        name: getFunctionName(fn),
                        complexity,
                        max
                    }
                });
            }
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check
        };
    }
};
