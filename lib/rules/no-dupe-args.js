"use strict";

/**
 * @param {object} param
 * @returns {string|null}
 */
function paramName(param) {
    if (!param) {
        return null;
    }
    if (param.type === "Identifier") {
        return param.name;
    }
    if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
        return param.left.name;
    }
    if (param.type === "RestElement" && param.argument.type === "Identifier") {
        return param.argument.name;
    }

    return null;
}

/**
 * @param {object} fn
 */
function checkParams(fn, context) {
    const counts = new Map();

    for (const p of fn.params) {
        const name = paramName(p);

        if (name === null) {
            continue;
        }
        counts.set(name, (counts.get(name) || 0) + 1);
        if (counts.get(name) > 1) {
            context.report({
                node: p.type === "Identifier" ? p : p.left || p.argument || p,
                messageId: "duplicateArg",
                data: { name }
            });
        }
    }
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow duplicate names in function parameters."
        },
        schema: [],
        messages: {
            duplicateArg: "Duplicate parameter '{{name}}' not allowed."
        }
    },
    create(context) {
        return {
            FunctionDeclaration(node) {
                checkParams(node, context);
            },
            FunctionExpression(node) {
                checkParams(node, context);
            },
            ArrowFunctionExpression(node) {
                checkParams(node, context);
            }
        };
    }
};
