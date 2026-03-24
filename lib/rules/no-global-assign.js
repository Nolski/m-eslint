"use strict";

const READ_ONLY_GLOBALS = new Set([
    "undefined",
    "NaN",
    "Infinity",
    "Object",
    "Function",
    "Array",
    "String",
    "Boolean",
    "Number",
    "Symbol",
    "Math",
    "Date",
    "RegExp",
    "JSON",
    "Intl",
    "Reflect",
    "Promise",
    "Proxy",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Error",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent"
]);

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments to read-only global bindings."
        },
        schema: [],
        messages: {
            globalAssign: "Cannot assign to read-only global '{{name}}'."
        }
    },

    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.left.type !== "Identifier") {
                    return;
                }

                const name = node.left.name;

                if (!READ_ONLY_GLOBALS.has(name)) {
                    return;
                }

                if (!context.sourceCode.isGlobalReference(node.left)) {
                    return;
                }

                context.report({
                    node: node.left,
                    messageId: "globalAssign",
                    data: { name }
                });
            }
        };
    }
};
