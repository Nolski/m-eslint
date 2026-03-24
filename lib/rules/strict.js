"use strict";

/**
 * @param {unknown} raw
 * @returns {string}
 */
function getMode(raw) {
    if (typeof raw === "string") {
        return raw;
    }

    if (Array.isArray(raw) && typeof raw[0] === "string") {
        return raw[0];
    }

    return "safe";
}

/**
 * @param {object} program
 * @returns {boolean}
 */
function hasGlobalUseStrict(program) {
    if (!program || program.type !== "Program") {
        return false;
    }

    const first = program.body[0];

    if (!first || first.type !== "ExpressionStatement") {
        return false;
    }

    if (first.directive === "use strict") {
        return true;
    }

    const e = first.expression;

    return (
        e &&
        e.type === "Literal" &&
        e.value === "use strict"
    );
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require or disallow strict mode directives."
        },
        schema: [
            {
                enum: ["safe", "global", "function", "never"]
            }
        ],
        messages: {
            strictRequired: "'use strict' directive is required."
        }
    },

    create(context) {
        const mode = getMode(context.options);
        const sourceType =
            (context.languageOptions && context.languageOptions.sourceType) ||
            "script";

        return {
            Program(node) {
                if (mode === "never") {
                    if (hasGlobalUseStrict(node)) {
                        context.report({
                            node: node.body[0],
                            messageId: "strictRequired"
                        });
                    }

                    return;
                }

                if (mode === "safe") {
                    if (sourceType === "module") {
                        return;
                    }
                }

                if (mode === "global" || mode === "safe") {
                    if (!hasGlobalUseStrict(node)) {
                        context.report({
                            node,
                            messageId: "strictRequired"
                        });
                    }
                }
            }
        };
    }
};
