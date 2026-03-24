"use strict";

/**
 * @param {object} block
 * @param {object} sourceCode
 * @returns {boolean}
 */
function hasInnerComment(block, sourceCode) {
    if (!block || block.type !== "BlockStatement") {
        return false;
    }

    return sourceCode.getCommentsInside(block).length > 0;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow empty block statements."
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowEmptyCatch: { type: "boolean" }
                },
                additionalProperties: false
            }
        ],
        messages: {
            emptyBlock: "Empty block statement."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const allowEmptyCatch =
            context.options &&
            typeof context.options === "object" &&
            context.options.allowEmptyCatch === true;

        return {
            BlockStatement(node) {
                if (node.body.length > 0) {
                    return;
                }

                if (hasInnerComment(node, sourceCode)) {
                    return;
                }

                const parent = node.parent;

                if (
                    allowEmptyCatch &&
                    parent &&
                    parent.type === "CatchClause" &&
                    parent.body === node
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: "emptyBlock"
                });
            }
        };
    }
};
