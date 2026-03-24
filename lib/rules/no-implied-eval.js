"use strict";

const NAMES = new Set(["setTimeout", "setInterval"]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow implied `eval` via timer APIs."
        },
        schema: [],
        messages: {
            impliedEval: "Implied eval. Consider passing a function."
        }
    },

    create(context) {
        return {
            CallExpression(node) {
                const c = node.callee;
                let name = null;

                if (c && c.type === "Identifier") {
                    name = c.name;
                } else if (
                    c &&
                    c.type === "MemberExpression" &&
                    !c.computed &&
                    c.property.type === "Identifier"
                ) {
                    name = c.property.name;
                }

                if (!name || !NAMES.has(name)) {
                    return;
                }

                const first = node.arguments[0];

                if (
                    first &&
                    first.type === "Literal" &&
                    typeof first.value === "string"
                ) {
                    context.report({
                        node: first,
                        messageId: "impliedEval"
                    });
                }
            }
        };
    }
};
