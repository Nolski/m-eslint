"use strict";

/**
 * @param {unknown} raw
 * @returns {string}
 */
function getMode(raw) {
    if (typeof raw === "string") {
        return raw;
    }

    return "always";
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require object property shorthand."
        },
        fixable: "code",
        schema: [
            {
                enum: ["always", "methods", "properties", "never", "consistent"]
            }
        ],
        messages: {
            useShorthand: "Expected shorthand for '{{property}}'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const mode = getMode(context.options);

        return {
            Property(node) {
                if (node.kind !== "init" || node.computed) {
                    return;
                }

                if (mode === "never") {
                    return;
                }

                const k = node.key;
                const v = node.value;

                if (
                    k.type !== "Identifier" ||
                    v.type !== "Identifier" ||
                    k.name !== v.name
                ) {
                    return;
                }

                if (mode === "methods" && node.method) {
                    return;
                }

                if (mode === "properties" && !node.method) {
                    return;
                }

                context.report({
                    node,
                    messageId: "useShorthand",
                    data: { property: k.name },
                    fix(fixer) {
                        return fixer.replaceText(node, k.name);
                    }
                });
            }
        };
    }
};
