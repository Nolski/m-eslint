"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `arguments.caller` and `arguments.callee`."
        },
        schema: [],
        messages: {
            noCaller: "'arguments.{{prop}}' is deprecated."
        }
    },

    create(context) {
        return {
            MemberExpression(node) {
                const obj = node.object;
                const prop = node.property;

                if (
                    !obj ||
                    obj.type !== "Identifier" ||
                    obj.name !== "arguments"
                ) {
                    return;
                }

                if (node.computed) {
                    return;
                }

                if (!prop || prop.type !== "Identifier") {
                    return;
                }

                if (prop.name !== "caller" && prop.name !== "callee") {
                    return;
                }

                context.report({
                    node,
                    messageId: "noCaller",
                    data: { prop: prop.name }
                });
            }
        };
    }
};
