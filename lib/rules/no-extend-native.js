"use strict";

const NATIVES = new Set([
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Function",
    "RegExp",
    "Date",
    "Error",
    "Symbol",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Promise",
    "Reflect",
    "JSON",
    "Math"
]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow extending native objects."
        },
        schema: [],
        messages: {
            extendNative: "Extending native '{{object}}' is not allowed."
        }
    },

    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.left.type !== "MemberExpression" || node.left.computed) {
                    return;
                }

                const o = node.left.object;

                if (
                    o.type !== "MemberExpression" ||
                    o.computed ||
                    o.object.type !== "Identifier" ||
                    o.property.type !== "Identifier" ||
                    o.property.name !== "prototype"
                ) {
                    return;
                }

                const ctor = o.object.name;

                if (!NATIVES.has(ctor)) {
                    return;
                }

                context.report({
                    node: node.left,
                    messageId: "extendNative",
                    data: { object: ctor }
                });
            }
        };
    }
};
