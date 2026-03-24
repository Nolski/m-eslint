"use strict";

/**
 * @param {object} node
 * @returns {object|null}
 */
function getLoopBody(node) {
    if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
        return node.body;
    }
    if (node.type === "ForStatement") {
        return node.body;
    }

    return null;
}

/**
 * @param {object} node
 * @returns {Set<string>}
 */
function assignedNamesInSubtree(node) {
    const names = new Set();

    /**
     * @param {object} n
     */
    function walk(n) {
        if (!n) {
            return;
        }
        if (n.type === "AssignmentExpression") {
            if (n.left.type === "Identifier") {
                names.add(n.left.name);
            }
            walk(n.right);
            return;
        }
        if (n.type === "UpdateExpression" && n.argument.type === "Identifier") {
            names.add(n.argument.name);
            return;
        }
        if (n.type === "VariableDeclaration") {
            for (const d of n.declarations) {
                if (d.id.type === "Identifier") {
                    names.add(d.id.name);
                }
            }
        }
        if (n.type === "BlockStatement") {
            for (const st of n.body) {
                walk(st);
            }
        }
    }

    walk(node);

    return names;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow loop conditions that never change within the loop body."
        },
        schema: [],
        messages: {
            stale: "The loop condition variable `{{name}}` is not updated inside the loop body."
        }
    },
    create(context) {
        return {
            WhileStatement(node) {
                if (!node.test || node.test.type !== "Identifier") {
                    return;
                }
                const body = getLoopBody(node);

                if (!body) {
                    return;
                }

                const name = node.test.name;
                const assigned = assignedNamesInSubtree(body);

                if (!assigned.has(name)) {
                    context.report({
                        node: node.test,
                        messageId: "stale",
                        data: { name }
                    });
                }
            }
        };
    }
};
