"use strict";

const { KEYS, getKeys } = require("eslint-visitor-keys");

/**
 * @param {import("estree").Node} node
 * @returns {readonly string[]}
 */
function visitorKeysFor(node) {
    if (!node || typeof node !== "object") {
        return [];
    }
    if (Object.hasOwn(KEYS, node.type)) {
        return KEYS[node.type];
    }
    return getKeys(node);
}

/**
 * @param {import("estree").Node | null | undefined} node
 * @param {import("estree").Node | null} parent
 * @param {{ enter?: Function, leave?: Function }} visitor
 */
function walk(node, parent, visitor) {
    if (node === null || node === undefined) {
        return;
    }
    if (typeof node !== "object") {
        return;
    }

    if (typeof visitor.enter === "function") {
        visitor.enter(node, parent);
    }

    const keys = visitorKeysFor(node);

    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(node, key)) {
            continue;
        }
        const child = node[key];

        if (Array.isArray(child)) {
            for (const item of child) {
                walk(item, node, visitor);
            }
        } else {
            walk(child, node, visitor);
        }
    }

    if (typeof visitor.leave === "function") {
        visitor.leave(node, parent);
    }
}

/**
 * Depth-first AST traversal using eslint-visitor-keys.
 *
 * @param {import("estree").Node} ast
 * @param {{ enter?: (node: import("estree").Node, parent: import("estree").Node | null) => void, leave?: (node: import("estree").Node, parent: import("estree").Node | null) => void }} visitor
 */
function traverse(ast, visitor) {
    walk(ast, null, visitor);
}

class Traverser {
    /**
     * @param {import("estree").Node} ast
     * @param {{ enter?: Function, leave?: Function }} visitor
     */
    static traverse(ast, visitor) {
        traverse(ast, visitor);
    }
}

module.exports = { traverse, Traverser };
