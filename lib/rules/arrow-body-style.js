"use strict";

/**
 * @param {unknown} raw
 * @returns {string}
 */
function getMode(raw) {
    if (typeof raw === "string") {
        return raw;
    }

    return "as-needed";
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require or disallow braces around arrow function bodies."
        },
        fixable: "code",
        schema: [
            {
                enum: ["as-needed", "always", "never"]
            }
        ],
        messages: {
            wrapBody: "Expected block body around arrow function.",
            unwrapBody: "Expected no block around single-expression arrow."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const mode = getMode(context.options);

        return {
            ArrowFunctionExpression(node) {
                const body = node.body;

                if (mode === "always") {
                    if (body.type !== "BlockStatement") {
                        context.report({
                            node: body,
                            messageId: "wrapBody",
                            fix(fixer) {
                                const t = sourceCode.getText(body);

                                return fixer.replaceText(
                                    body,
                                    `{ return ${t}; }`
                                );
                            }
                        });
                    }

                    return;
                }

                if (mode === "never" || mode === "as-needed") {
                    if (
                        body.type === "BlockStatement" &&
                        body.body.length === 1 &&
                        body.body[0].type === "ReturnStatement" &&
                        body.body[0].argument
                    ) {
                        const arg = body.body[0].argument;

                        context.report({
                            node: body,
                            messageId: "unwrapBody",
                            fix(fixer) {
                                return fixer.replaceText(
                                    body,
                                    sourceCode.getText(arg)
                                );
                            }
                        });
                    }
                }
            }
        };
    }
};
