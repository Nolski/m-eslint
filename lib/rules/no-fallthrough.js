"use strict";

/**
 * @param {object} stmt
 * @returns {object|null}
 */
function effectiveLastStatement(stmt) {
    let s = stmt;

    while (s && s.type === "BlockStatement" && s.body.length) {
        s = s.body[s.body.length - 1];
    }

    return s || null;
}

/**
 * @param {object} stmt
 * @returns {boolean}
 */
function isDisruptor(stmt) {
    if (!stmt) {
        return false;
    }
    const t = stmt.type;

    return (
        t === "BreakStatement" ||
        t === "ReturnStatement" ||
        t === "ThrowStatement" ||
        t === "ContinueStatement"
    );
}

/**
 * @param {object[]} comments
 * @param {number} afterLast
 * @param {number} beforeNext
 */
function findFallthroughComment(comments, afterLast, beforeNext) {
    for (const c of comments) {
        if (!c || !Array.isArray(c.range)) {
            continue;
        }
        if (c.range[0] < beforeNext && c.range[1] > afterLast) {
            const raw = typeof c.value === "string" ? c.value : "";

            if (/falls?\s+through/i.test(raw)) {
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow switch case fallthrough without an explicit comment."
        },
        schema: [],
        messages: {
            fallthrough: "Expected a 'break' statement before falling through to the next case."
        }
    },
    create(context) {
        return {
            SwitchCase(node) {
                if (node.consequent.length === 0) {
                    return;
                }

                const last = node.consequent[node.consequent.length - 1];
                const eff = effectiveLastStatement(last);

                if (isDisruptor(eff)) {
                    return;
                }

                const cases = node.parent.cases;
                const idx = cases.indexOf(node);

                if (idx === -1 || idx === cases.length - 1) {
                    return;
                }

                const afterLast = last.range[1];
                const beforeNext = cases[idx + 1].range[0];

                if (findFallthroughComment(context.sourceCode.getAllComments(), afterLast, beforeNext)) {
                    return;
                }

                context.report({ node: last, messageId: "fallthrough" });
            }
        };
    }
};
