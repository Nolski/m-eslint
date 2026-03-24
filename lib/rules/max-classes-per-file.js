"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Limit the number of classes per file."
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1 }
                },
                additionalProperties: false
            }
        ],
        messages: {
            tooMany: "This file declares {{count}} classes; the maximum allowed is {{max}}."
        }
    },
    create(context) {
        const max = (context.options[0] && context.options[0].max) || 1;

        return {
            Program(node) {
                let count = 0;

                /**
                 * @param {object} n
                 */
                function walk(n) {
                    if (!n) {
                        return;
                    }
                    if (n.type === "ClassDeclaration" || n.type === "ClassExpression") {
                        count += 1;
                    }
                    for (const key of Object.keys(n)) {
                        if (key === "parent") {
                            continue;
                        }
                        const v = n[key];

                        if (Array.isArray(v)) {
                            for (const c of v) {
                                walk(c);
                            }
                        } else if (v && typeof v === "object") {
                            walk(v);
                        }
                    }
                }

                walk(node);
                if (count > max) {
                    context.report({ node, messageId: "tooMany", data: { count, max } });
                }
            }
        };
    }
};
