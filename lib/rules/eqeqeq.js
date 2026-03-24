"use strict";

/**
 * @param {unknown} raw
 * @returns {{ mode: string, nullHandling: string }}
 */
function parseOptions(raw) {
    const defaults = { mode: "always", nullHandling: "always" };

    if (!raw) {
        return defaults;
    }

    if (Array.isArray(raw)) {
        const mode = typeof raw[0] === "string" ? raw[0] : "always";
        const obj = raw[1] && typeof raw[1] === "object" ? raw[1] : {};
        const nullHandling =
            typeof obj.null === "string" ? obj.null : "always";

        return { mode, nullHandling };
    }

    return defaults;
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isNullLiteral(node) {
    return node && node.type === "Literal" && node.value === null;
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isUndefinedLiteral(node) {
    return (
        node &&
        node.type === "Identifier" &&
        node.name === "undefined"
    );
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function isTypeofExpression(node) {
    return (
        node &&
        node.type === "UnaryExpression" &&
        node.operator === "typeof"
    );
}

/**
 * @param {object} left
 * @param {object} right
 * @param {string} mode
 * @param {string} nullHandling
 * @returns {boolean}
 */
function isAllowedSmart(left, right, mode, nullHandling) {
    if (mode !== "smart" && mode !== "allow-null") {
        return false;
    }

    if (nullHandling === "ignore") {
        if (
            (isNullLiteral(left) && isUndefinedLiteral(right)) ||
            (isUndefinedLiteral(left) && isNullLiteral(right))
        ) {
            return true;
        }
    }

    if (
        (isNullLiteral(left) || isNullLiteral(right)) ||
        (isUndefinedLiteral(left) || isUndefinedLiteral(right))
    ) {
        if (nullHandling === "never") {
            return false;
        }
        return true;
    }

    if (
        isTypeofExpression(left) ||
        isTypeofExpression(right)
    ) {
        return true;
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require `===` and `!==`."
        },
        fixable: "code",
        schema: [
            {
                type: "array",
                items: [
                    { enum: ["always", "smart", "allow-null"] },
                    {
                        type: "object",
                        properties: {
                            null: { enum: ["always", "never", "ignore"] }
                        },
                        additionalProperties: false
                    }
                ],
                minItems: 0,
                maxItems: 2
            }
        ],
        messages: {
            strictEquality: "Use '{{operator}}' instead of '{{actual}}'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const { mode, nullHandling } = parseOptions(context.options);

        return {
            BinaryExpression(node) {
                if (node.operator !== "==" && node.operator !== "!=") {
                    return;
                }

                if (
                    isAllowedSmart(
                        node.left,
                        node.right,
                        mode,
                        nullHandling
                    )
                ) {
                    return;
                }

                const actual = node.operator;
                const operator = actual === "==" ? "===" : "!==";

                context.report({
                    node,
                    messageId: "strictEquality",
                    data: { actual, operator },
                    fix(fixer) {
                        const opTok = sourceCode
                            .getTokens(node)
                            .find((t) => t.value === actual);

                        return opTok
                            ? fixer.replaceText(opTok, operator)
                            : null;
                    }
                });
            }
        };
    }
};
