"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce variables to be declared together or separately."
        },
        schema: [
            {
                enum: ["always", "never"]
            }
        ],
        messages: {
            always: "Combine consecutive `var` declarations into one statement.",
            never: "Split combined `var` declarations into separate statements."
        }
    },
    create(context) {
        const mode = context.options[0] || "always";

        return {
            Program(node) {
                if (mode !== "never") {
                    return;
                }
                /**
                 * @param {object} n
                 */
                function walk(n) {
                    if (!n) {
                        return;
                    }
                    if (n.type === "VariableDeclaration" && n.kind === "var" && n.declarations.length > 1) {
                        context.report({ node, messageId: "never" });
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
            }
        };
    }
};
