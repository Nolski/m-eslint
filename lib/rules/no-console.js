"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `console` usage."
        },
        hasSuggestions: true,
        schema: [
            {
                type: "object",
                properties: {
                    allow: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            noConsole: "Console usage detected.",
            removeSuggestion: "Remove console call."
        }
    },

    create(context) {
        const opts = context.options && typeof context.options === "object"
            ? context.options
            : {};
        const allow = new Set(
            Array.isArray(opts.allow) ? opts.allow : []
        );

        return {
            MemberExpression(node) {
                if (
                    node.object &&
                    node.object.type === "Identifier" &&
                    node.object.name === "console" &&
                    !node.computed &&
                    node.property &&
                    node.property.type === "Identifier"
                ) {
                    const name = node.property.name;

                    if (allow.has(name)) {
                        return;
                    }

                    let current = node;

                    while (
                        current.parent &&
                        current.parent.type === "MemberExpression" &&
                        current.parent.object === current
                    ) {
                        current = current.parent;
                    }

                    const top = current;

                    context.report({
                        node: top,
                        messageId: "noConsole",
                        suggest: [
                            {
                                desc: "Remove console call.",
                                fix(fixer) {
                                    let expr = top;

                                    while (
                                        expr.parent &&
                                        expr.parent.type === "MemberExpression" &&
                                        expr.parent.object === expr
                                    ) {
                                        expr = expr.parent;
                                    }

                                    let removeNode = expr;

                                    if (
                                        expr.parent &&
                                        expr.parent.type === "CallExpression" &&
                                        expr.parent.callee === expr
                                    ) {
                                        removeNode = expr.parent;
                                    }

                                    return fixer.remove(removeNode);
                                }
                            }
                        ]
                    });
                }
            }
        };
    }
};
