"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

/**
 * @param {object} sourceCode
 * @param {object} left
 * @param {object} right
 * @returns {boolean}
 */
function isMultilineBetween(sourceCode, left, right) {
    if (!left || !right || !left.loc || !right.loc) {
        return false;
    }
    return left.loc.end.line !== right.loc.start.line;
}

/**
 * @param {object} sourceCode
 * @param {object} node
 * @returns {object|null}
 */
function getFunctionParamClosingParen(sourceCode, node) {
    if (!node.params.length || !node.body) {
        return null;
    }

    const bodyFirst = sourceCode.getFirstToken(node.body);
    let beforeBody = sourceCode.getTokenBefore(bodyFirst);

    if (beforeBody && beforeBody.value === ")") {
        return beforeBody;
    }

    if (beforeBody && beforeBody.value === "=>") {
        const p = sourceCode.getTokenBefore(beforeBody);

        if (p && p.value === ")") {
            return p;
        }
    }

    return null;
}

/**
 * @param {object} sourceCode
 * @param {object} context
 * @param {object} closing
 * @param {string} mode
 * @param {boolean} hasElements
 * @param {object|null} lastItem
 */
function checkClosing(sourceCode, context, closing, mode, hasElements, lastItem) {
    if (!hasElements || !closing) {
        return;
    }

    const prev = sourceCode.getTokenBefore(closing);

    if (!prev) {
        return;
    }

    const isComma = prev.type === "Punctuator" && prev.value === ",";
    const multiline = lastItem && isMultilineBetween(sourceCode, lastItem, closing);

    if (mode === "never") {
        if (isComma) {
            context.report({
                loc: prev.loc,
                messageId: "extraComma",
                fix(fixer) {
                    return fixer.remove(prev);
                }
            });
        }
        return;
    }

    if (mode === "always") {
        if (!isComma) {
            context.report({
                loc: prev.loc,
                messageId: "missingComma",
                fix(fixer) {
                    return fixer.insertTextAfter(prev, ",");
                }
            });
        }
        return;
    }

    if (mode === "always-multiline") {
        if (multiline && !isComma) {
            context.report({
                loc: prev.loc,
                messageId: "missingComma",
                fix(fixer) {
                    return fixer.insertTextAfter(prev, ",");
                }
            });
        } else if (!multiline && isComma) {
            context.report({
                loc: prev.loc,
                messageId: "extraComma",
                fix(fixer) {
                    return fixer.remove(prev);
                }
            });
        }
        return;
    }

    if (mode === "only-multiline") {
        if (!multiline && isComma) {
            context.report({
                loc: prev.loc,
                messageId: "extraComma",
                fix(fixer) {
                    return fixer.remove(prev);
                }
            });
        } else if (multiline && !isComma) {
            context.report({
                loc: prev.loc,
                messageId: "missingComma",
                fix(fixer) {
                    return fixer.insertTextAfter(prev, ",");
                }
            });
        }
    }
}

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Require or disallow trailing commas."
        },
        fixable: "code",
        deprecated: DEPRECATED,
        schema: [
            {
                enum: ["never", "always", "always-multiline", "only-multiline"]
            }
        ],
        messages: {
            missingComma: "Missing trailing comma.",
            extraComma: "Unexpected trailing comma."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const raw = context.options[0];
        const mode =
            raw === "always"
                ? "always"
                : raw === "always-multiline"
                  ? "always-multiline"
                  : raw === "only-multiline"
                    ? "only-multiline"
                    : "never";

        /**
         * @param {object} node
         */
        function checkFunctionParams(node) {
            const closeParen = getFunctionParamClosingParen(sourceCode, node);

            if (!closeParen || !node.params.length) {
                return;
            }

            const last = node.params[node.params.length - 1];

            checkClosing(
                sourceCode,
                context,
                closeParen,
                mode,
                node.params.length > 0,
                last
            );
        }

        return {
            ArrayExpression(node) {
                const last = node.elements.length ? node.elements[node.elements.length - 1] : null;

                checkClosing(
                    sourceCode,
                    context,
                    sourceCode.getLastToken(node),
                    mode,
                    node.elements.length > 0,
                    last
                );
            },
            ObjectExpression(node) {
                const props = node.properties;
                const last = props.length ? props[props.length - 1] : null;

                checkClosing(
                    sourceCode,
                    context,
                    sourceCode.getLastToken(node),
                    mode,
                    props.length > 0,
                    last
                );
            },
            CallExpression(node) {
                const last =
                    node.arguments.length > 0 ? node.arguments[node.arguments.length - 1] : null;

                checkClosing(
                    sourceCode,
                    context,
                    sourceCode.getLastToken(node),
                    mode,
                    node.arguments.length > 0,
                    last
                );
            },
            NewExpression(node) {
                const last =
                    node.arguments.length > 0 ? node.arguments[node.arguments.length - 1] : null;

                checkClosing(
                    sourceCode,
                    context,
                    sourceCode.getLastToken(node),
                    mode,
                    node.arguments.length > 0,
                    last
                );
            },
            FunctionDeclaration: checkFunctionParams,
            FunctionExpression: checkFunctionParams,
            ArrowFunctionExpression: checkFunctionParams,
            ImportDeclaration(node) {
                if (!node.source || !node.specifiers.length) {
                    return;
                }

                const beforeFrom = sourceCode.getTokenBefore(node.source);

                if (!beforeFrom || beforeFrom.value !== "}") {
                    return;
                }

                const last = node.specifiers[node.specifiers.length - 1];

                checkClosing(
                    sourceCode,
                    context,
                    beforeFrom,
                    mode,
                    node.specifiers.length > 0,
                    last
                );
            }
        };
    }
};
