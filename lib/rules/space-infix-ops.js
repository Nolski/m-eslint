"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

const INFIX = new Set([
    "+",
    "-",
    "*",
    "/",
    "%",
    "**",
    "|",
    "&",
    "^",
    "<<",
    ">>",
    ">>>",
    "==",
    "!=",
    "===",
    "!==",
    "<",
    ">",
    "<=",
    ">=",
    "in",
    "instanceof",
    "??",
    "&&",
    "||"
]);

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Require spaces around infix operators."
        },
        fixable: "whitespace",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            missingSpace: "Spaces are required around '{{operator}}'."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            BinaryExpression(node) {
                const op = sourceCode.getFirstTokenBetween(node.left, node.right);

                if (!op || !INFIX.has(op.value)) {
                    return;
                }

                const before = sourceCode.text.slice(node.left.range[1], op.range[0]);
                const after = sourceCode.text.slice(op.range[1], node.right.range[0]);

                if (before.length > 0 && !/\s/u.test(before)) {
                    context.report({
                        loc: op.loc,
                        messageId: "missingSpace",
                        data: { operator: op.value },
                        fix(fixer) {
                            return fixer.insertTextBefore(op, " ");
                        }
                    });
                }

                if (after.length > 0 && !/\s/u.test(after)) {
                    context.report({
                        loc: op.loc,
                        messageId: "missingSpace",
                        data: { operator: op.value },
                        fix(fixer) {
                            return fixer.insertTextAfter(op, " ");
                        }
                    });
                }
            },
            LogicalExpression(node) {
                const op = sourceCode.getFirstTokenBetween(node.left, node.right);

                if (!op) {
                    return;
                }

                const before = sourceCode.text.slice(node.left.range[1], op.range[0]);
                const after = sourceCode.text.slice(op.range[1], node.right.range[0]);

                if (before.length > 0 && !/\s/u.test(before)) {
                    context.report({
                        loc: op.loc,
                        messageId: "missingSpace",
                        data: { operator: op.value },
                        fix(fixer) {
                            return fixer.insertTextBefore(op, " ");
                        }
                    });
                }

                if (after.length > 0 && !/\s/u.test(after)) {
                    context.report({
                        loc: op.loc,
                        messageId: "missingSpace",
                        data: { operator: op.value },
                        fix(fixer) {
                            return fixer.insertTextAfter(op, " ");
                        }
                    });
                }
            }
        };
    }
};
