"use strict";

/**
 * @param {string} text
 * @param {number} assignStart
 * @returns {boolean}
 */
function hasGroupingParensBeforeAssignment(text, assignStart) {
    const pre = text.slice(0, assignStart);

    return /\(\s*\(/u.test(pre);
}

/**
 * @param {object} context
 * @param {object} testParent
 * @param {object} assignNode
 */
function reportIfIllegal(context, testParent, assignNode) {
    const raw = context.options;
    const mode =
        typeof raw === "string" && (raw === "except-parens" || raw === "always")
            ? raw
            : "except-parens";
    const src = context.sourceCode.text;

    if (mode === "except-parens" && hasGroupingParensBeforeAssignment(src, assignNode.range[0])) {
        return;
    }

    context.report({ node: assignNode, messageId: "assignInCondition" });
}

/**
 * @param {object} node
 * @returns {object|null}
 */
function findAssignment(node) {
    if (!node) {
        return null;
    }
    if (node.type === "AssignmentExpression") {
        return node;
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignment expressions where a boolean is expected."
        },
        schema: [
            {
                oneOf: [
                    { enum: ["except-parens", "always"] },
                    { type: "object", additionalProperties: false }
                ]
            }
        ],
        messages: {
            assignInCondition: "Assignment within a conditional expression."
        }
    },
    create(context) {
        return {
            IfStatement(node) {
                const a = findAssignment(node.test);

                if (a) {
                    reportIfIllegal(context, node, a);
                }
            },
            WhileStatement(node) {
                const a = findAssignment(node.test);

                if (a) {
                    reportIfIllegal(context, node, a);
                }
            },
            DoWhileStatement(node) {
                const a = findAssignment(node.test);

                if (a) {
                    reportIfIllegal(context, node, a);
                }
            },
            ForStatement(node) {
                const a = findAssignment(node.test);

                if (a) {
                    reportIfIllegal(context, node, a);
                }
            },
            ConditionalExpression(node) {
                const a = findAssignment(node.test);

                if (a) {
                    reportIfIllegal(context, node, a);
                }
            }
        };
    }
};
