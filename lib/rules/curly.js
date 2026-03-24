"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function isBlock(node) {
    return node && node.type === "BlockStatement";
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function spansMultipleLines(node) {
    if (!node || !node.loc) {
        return false;
    }

    return node.loc.start.line !== node.loc.end.line;
}

/**
 * @param {object} body
 * @param {string} style
 * @param {object} [parentIf]
 * @returns {boolean}
 */
function needsBraces(body, style, parentIf) {
    if (!body) {
        return false;
    }

    if (isBlock(body)) {
        return false;
    }

    if (style === "all") {
        return true;
    }

    if (style === "multi" || style === "multi-line") {
        return spansMultipleLines(body);
    }

    if (style === "multi-or-nest") {
        if (body.type === "IfStatement") {
            return true;
        }

        return spansMultipleLines(body);
    }

    if (style === "consistent") {
        if (
            parentIf &&
            parentIf.alternate === body &&
            isBlock(parentIf.consequent)
        ) {
            return true;
        }

        return true;
    }

    return true;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require curly braces for control statements."
        },
        fixable: "code",
        schema: [
            {
                enum: ["all", "multi", "multi-line", "multi-or-nest", "consistent"]
            }
        ],
        messages: {
            missingCurly: "Curly braces are required."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const raw = context.options;

        const style = typeof raw === "string"
            ? raw
            : Array.isArray(raw) && typeof raw[0] === "string"
                ? raw[0]
                : "all";

        /**
         * @param {object} body
         * @param {object} parent
         */
        function checkBody(body, parent) {
            if (!needsBraces(body, style, parent)) {
                return;
            }

            context.report({
                node: body,
                messageId: "missingCurly",
                fix(fixer) {
                    const text = sourceCode.getText(body);

                    return fixer.replaceText(body, `{ ${text} }`);
                }
            });
        }

        return {
            IfStatement(node) {
                checkBody(node.consequent, node);

                if (node.alternate) {
                    if (node.alternate.type === "IfStatement") {
                        checkBody(node.alternate.consequent, node.alternate);
                    } else {
                        checkBody(node.alternate, node);
                    }
                }
            },
            WhileStatement(node) {
                checkBody(node.body, node);
            },
            ForStatement(node) {
                checkBody(node.body, node);
            },
            ForInStatement(node) {
                checkBody(node.body, node);
            },
            ForOfStatement(node) {
                checkBody(node.body, node);
            },
            DoWhileStatement(node) {
                checkBody(node.body, node);
            }
        };
    }
};
