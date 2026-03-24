"use strict";

/**
 * @param {object} stmt
 * @returns {boolean}
 */
function isTerminator(stmt) {
    if (!stmt) {
        return false;
    }
    const t = stmt.type;

    return (
        t === "ReturnStatement" ||
        t === "ThrowStatement" ||
        t === "BreakStatement" ||
        t === "ContinueStatement"
    );
}

/**
 * @param {object[]} body
 * @param {object} context
 */
function checkBlockBody(body, context) {
    let unreachable = false;

    for (const st of body) {
        if (unreachable) {
            context.report({ node: st, messageId: "unreachableCode" });
        }
        if (isTerminator(st)) {
            unreachable = true;
        } else if (st.type === "BlockStatement") {
            checkBlockBody(st.body, context);
        }
    }
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow unreachable code after control-flow statements."
        },
        schema: [],
        messages: {
            unreachableCode: "Unreachable code detected."
        }
    },
    create(context) {
        return {
            BlockStatement(node) {
                checkBlockBody(node.body, context);
            }
        };
    }
};
