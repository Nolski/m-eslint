"use strict";

/**
 * @param {object} node
 * @returns {string|null}
 */
function loopVarNameFromTest(node) {
    if (!node || node.type !== "BinaryExpression") {
        return null;
    }
    if (node.left.type !== "Identifier") {
        return null;
    }

    return node.left.name;
}

/**
 * @param {object} test
 * @returns {"up"|"down"|null}
 */
function expectedDirection(test) {
    if (!test || test.type !== "BinaryExpression") {
        return null;
    }
    const { operator } = test;

    if (operator === "<" || operator === "<=") {
        return "up";
    }
    if (operator === ">" || operator === ">=") {
        return "down";
    }

    return null;
}

/**
 * @param {object} update
 * @param {string} name
 * @returns {"up"|"down"|null}
 */
function actualDirection(update, name) {
    if (!update) {
        return null;
    }
    if (update.type === "UpdateExpression" && update.argument.type === "Identifier") {
        if (update.argument.name !== name) {
            return null;
        }

        return update.operator === "++" ? "up" : "down";
    }
    if (update.type === "AssignmentExpression" && update.left.type === "Identifier") {
        if (update.left.name !== name) {
            return null;
        }
        if (
            update.operator === "+=" &&
            update.right.type === "Literal" &&
            typeof update.right.value === "number" &&
            update.right.value > 0
        ) {
            return "up";
        }
        if (
            update.operator === "-=" &&
            update.right.type === "Literal" &&
            typeof update.right.value === "number" &&
            update.right.value > 0
        ) {
            return "down";
        }
    }

    return null;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow loop updates that move opposite to the loop condition."
        },
        schema: [],
        messages: {
            wrongDirection: "The update clause in this loop moves in the wrong direction."
        }
    },
    create(context) {
        return {
            ForStatement(node) {
                const { test, update } = node;

                if (!test || !update) {
                    return;
                }

                const varName = loopVarNameFromTest(test);
                const want = expectedDirection(test);
                const got = varName ? actualDirection(update, varName) : null;

                if (want && got && want !== got) {
                    context.report({ node: update, messageId: "wrongDirection" });
                }
            }
        };
    }
};
