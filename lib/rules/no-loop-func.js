"use strict";

const LOOP_TYPES = new Set([
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "WhileStatement",
    "DoWhileStatement"
]);

/**
 * @param {object} node
 * @returns {boolean}
 */
function insideLoop(node) {
    let p = node.parent;

    while (p) {
        if (LOOP_TYPES.has(p.type)) {
            return true;
        }
        p = p.parent;
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow functions declared inside loops."
        },
        schema: [],
        messages: {
            loopFunc: "Function declared in a loop contains unsafe references."
        }
    },

    create(context) {
        /**
         * @param {object} node
         */
        function check(node) {
            if (insideLoop(node)) {
                context.report({ node, messageId: "loopFunc" });
            }
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check
        };
    }
};
