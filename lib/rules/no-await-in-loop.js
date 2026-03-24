"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function isLoopNode(node) {
    return (
        node.type === "ForStatement" ||
        node.type === "ForInStatement" ||
        node.type === "ForOfStatement" ||
        node.type === "WhileStatement" ||
        node.type === "DoWhileStatement"
    );
}

/**
 * @param {object} node
 * @returns {object|null}
 */
function enclosingLoop(node) {
    let current = node.parent;

    while (current) {
        if (isLoopNode(current)) {
            return current;
        }
        current = current.parent;
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow await expressions inside loop bodies."
        },
        schema: [],
        messages: {
            awaitInLoop: "Unexpected `await` inside a loop; consider refactoring to avoid sequential awaits."
        }
    },
    create(context) {
        return {
            AwaitExpression(node) {
                if (enclosingLoop(node)) {
                    context.report({ node, messageId: "awaitInLoop" });
                }
            }
        };
    }
};
