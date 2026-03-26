"use strict";

const { KEYS, getKeys, unionWith } = require("eslint-visitor-keys");
const { TokenStore } = require("./token-store");

/**
 * @param {string} text
 * @returns {number[]}
 */
function computeLineStarts(text) {
    const starts = [0];

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (c === "\n") {
            starts.push(i + 1);
        } else if (c === "\r") {
            if (text[i + 1] === "\n") {
                starts.push(i + 2);
                i++;
            } else {
                starts.push(i + 1);
            }
        }
    }

    return starts;
}

/**
 * @param {number[]} lineStarts sorted ascending, lineStarts[0] === 0
 * @param {number} index
 * @returns {{ line: number, column: number }}
 */
function indexToLoc(lineStarts, index) {
    let lo = 0;
    let hi = lineStarts.length - 1;

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const s = lineStarts[mid];

        if (s <= index) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    const lineIdx = hi;
    const lineStart = lineStarts[lineIdx];

    return {
        line: lineIdx + 1,
        column: index - lineStart
    };
}

/**
 * @param {Record<string, readonly string[]>} mergedKeys
 * @param {{ type?: string }} node
 * @returns {string[]}
 */
function childKeysForNode(mergedKeys, node) {
    if (!node || typeof node !== "object" || !node.type) {
        return [];
    }

    const known = mergedKeys[node.type];

    if (Array.isArray(known)) {
        return [...known];
    }

    return [...getKeys(node)];
}

/**
 * @param {unknown} node
 * @param {unknown} parent
 * @param {Record<string, readonly string[]>} mergedKeys
 */
function attachParentPointers(node, parent, mergedKeys) {
    if (!node || typeof node !== "object") {
        return;
    }

    if (node.type) {
        node.parent = parent;
    }

    const keys = childKeysForNode(mergedKeys, node);

    for (const key of keys) {
        const child = node[key];

        if (!child) {
            continue;
        }

        if (Array.isArray(child)) {
            for (const c of child) {
                attachParentPointers(c, node, mergedKeys);
            }
        } else if (typeof child === "object") {
            attachParentPointers(child, node, mergedKeys);
        }
    }
}

class SourceCode {
    /**
     * @param {string | { text: string, ast: object, hasBOM?: boolean, parserServices?: object, scopeManager?: object, visitorKeys?: Record<string, string[]> }} textOrConfig
     * @param {object} [ast]
     */
    constructor(textOrConfig, ast) {
        let text;
        let configAst;
        let hasBOM;
        let parserServices;
        let scopeManager;
        let visitorKeys;

        if (typeof textOrConfig === "string") {
            text = textOrConfig;
            configAst = ast;
            hasBOM = undefined;
            parserServices = undefined;
            scopeManager = undefined;
            visitorKeys = undefined;
        } else {
            const cfg = textOrConfig || {};

            text = cfg.text;
            configAst = cfg.ast;
            hasBOM = cfg.hasBOM;
            parserServices = cfg.parserServices;
            scopeManager = cfg.scopeManager;
            visitorKeys = cfg.visitorKeys;
        }

        if (typeof text !== "string") {
            text = "";
        }

        this.text = text;
        this.ast = configAst;
        this.hasBOM = typeof hasBOM === "boolean" ? hasBOM : text.charCodeAt(0) === 0xfeff;
        this.parserServices = parserServices || {};
        this.scopeManager = scopeManager || null;
        this.visitorKeys = visitorKeys || null;

        this.lines = SourceCode.splitLines(text);
        this._lineStarts = computeLineStarts(text);

        this._mergedVisitorKeys = this.visitorKeys ? unionWith(this.visitorKeys) : KEYS;

        if (this.ast && typeof this.ast === "object") {
            attachParentPointers(this.ast, null, this._mergedVisitorKeys);
        }

        const tokens = this.ast && Array.isArray(this.ast.tokens) ? this.ast.tokens : [];
        const comments = this.ast && Array.isArray(this.ast.comments) ? this.ast.comments : [];

        this.tokens = tokens;
        this.comments = comments;
        this.tokenStore = new TokenStore(tokens, comments);

        // Sorted merge of tokens and comments by range position.
        // Plugins (e.g. @stylistic/no-multi-spaces) access this property.
        const merged = [];
        let ti = 0, ci = 0;
        while (ti < tokens.length || ci < comments.length) {
            if (ci >= comments.length ||
                (ti < tokens.length && tokens[ti].range[0] < comments[ci].range[0])) {
                merged.push(tokens[ti++]);
            } else {
                merged.push(comments[ci++]);
            }
        }
        this.tokensAndComments = merged;
    }

    /**
     * @param {string} text
     * @returns {string[]}
     */
    static splitLines(text) {
        if (typeof text !== "string" || text.length === 0) {
            return [""];
        }

        return text.split(/\r?\n|\r/);
    }

    /**
     * @param {object} [node]
     * @param {number} [beforeCount]
     * @param {number} [afterCount]
     * @returns {string}
     */
    getText(node, beforeCount, afterCount) {
        if (node === undefined) {
            return this.text;
        }

        const range = this.getRange(node);

        if (!range) {
            return "";
        }

        const [start, end] = range;
        const before = typeof beforeCount === "number" ? beforeCount : 0;
        const after = typeof afterCount === "number" ? afterCount : 0;
        const lo = Math.max(0, start - before);
        const hi = Math.min(this.text.length, end + after);

        return this.text.slice(lo, hi);
    }

    /**
     * @returns {string[]}
     */
    getLines() {
        return this.lines.slice();
    }

    /**
     * @param {{ range?: [number, number], loc?: object }} nodeOrToken
     * @returns {object | null}
     */
    getLoc(nodeOrToken) {
        if (!nodeOrToken) {
            return null;
        }

        return nodeOrToken.loc || null;
    }

    /**
     * @param {{ range?: [number, number] }} nodeOrToken
     * @returns {[number, number] | null}
     */
    getRange(nodeOrToken) {
        if (!nodeOrToken || !Array.isArray(nodeOrToken.range)) {
            return null;
        }

        return [nodeOrToken.range[0], nodeOrToken.range[1]];
    }

    /**
     * @param {number} index
     * @returns {{ line: number, column: number }}
     */
    getLocFromIndex(index) {
        if (index < 0) {
            index = 0;
        }

        if (index > this.text.length) {
            index = this.text.length;
        }

        return indexToLoc(this._lineStarts, index);
    }

    /**
     * @param {{ line: number, column: number }} loc
     * @returns {number}
     */
    getIndexFromLoc(loc) {
        if (!loc || typeof loc.line !== "number" || typeof loc.column !== "number") {
            return 0;
        }

        const line = loc.line;
        const column = loc.column;

        if (line < 1 || line > this._lineStarts.length) {
            return this.text.length;
        }

        const lineStart = this._lineStarts[line - 1];
        const idx = lineStart + column;

        if (idx < 0) {
            return 0;
        }

        if (idx > this.text.length) {
            return this.text.length;
        }

        return idx;
    }

    getFirstToken(node, options) {
        return this.tokenStore.getFirstToken(node, options);
    }

    getLastToken(node, options) {
        return this.tokenStore.getLastToken(node, options);
    }

    getTokenBefore(nodeOrToken, options) {
        return this.tokenStore.getTokenBefore(nodeOrToken, options);
    }

    getTokenAfter(nodeOrToken, options) {
        return this.tokenStore.getTokenAfter(nodeOrToken, options);
    }

    getTokensBetween(left, right, options) {
        return this.tokenStore.getTokensBetween(left, right, options);
    }

    getTokens(node, options) {
        return this.tokenStore.getTokens(node, options);
    }

    getTokenByRangeStart(offset, options) {
        return this.tokenStore.getTokenByRangeStart(offset, options);
    }

    getFirstTokenBetween(left, right, options) {
        return this.tokenStore.getFirstTokenBetween(left, right, options);
    }

    getLastTokenBetween(left, right, options) {
        return this.tokenStore.getLastTokenBetween(left, right, options);
    }

    /**
     * @returns {object[]}
     */
    getAllComments() {
        return this.comments.slice();
    }

    /**
     * @param {{ range?: [number, number] }} nodeOrToken
     * @returns {object[]}
     */
    getCommentsBefore(nodeOrToken) {
        if (!nodeOrToken || !Array.isArray(nodeOrToken.range)) {
            return [];
        }

        const prev = this.getTokenBefore(nodeOrToken, { includeComments: false });
        const left = prev ? prev.range[1] : 0;
        const right = nodeOrToken.range[0];

        return this.comments.filter(
            (c) => c.range[0] >= left && c.range[1] <= right
        );
    }

    /**
     * @param {{ range?: [number, number] }} nodeOrToken
     * @returns {object[]}
     */
    getCommentsAfter(nodeOrToken) {
        if (!nodeOrToken || !Array.isArray(nodeOrToken.range)) {
            return [];
        }

        const next = this.getTokenAfter(nodeOrToken, { includeComments: false });
        const left = nodeOrToken.range[1];
        const right = next ? next.range[0] : this.text.length;

        return this.comments.filter(
            (c) => c.range[0] >= left && c.range[1] <= right
        );
    }

    /**
     * @param {{ range?: [number, number] }} node
     * @returns {object[]}
     */
    getCommentsInside(node) {
        if (!node || !Array.isArray(node.range)) {
            return [];
        }

        const [start, end] = node.range;

        return this.comments.filter(
            (c) => c.range[0] >= start && c.range[1] <= end
        );
    }

    /**
     * @param {{ range?: [number, number] }} left
     * @param {{ range?: [number, number] }} right
     * @returns {boolean}
     */
    commentsExistBetween(left, right) {
        if (!left || !right || !Array.isArray(left.range) || !Array.isArray(right.range)) {
            return false;
        }

        const a = left.range[1];
        const b = right.range[0];
        const start = Math.min(a, b);
        const end = Math.max(a, b);

        return this.comments.some(
            (c) => c.range[0] >= start && c.range[1] <= end
        );
    }

    /**
     * @param {object} node
     * @returns {object[]}
     */
    getAncestors(node) {
        const out = [];
        let current = node && node.parent;

        while (current) {
            out.push(current);
            current = current.parent;
        }

        return out.reverse();
    }

    /**
     * @param {object} node
     * @returns {object[]}
     */
    getDeclaredVariables(node) {
        if (!this.scopeManager || !node) {
            return [];
        }

        if (typeof this.scopeManager.getDeclaredVariables === "function") {
            return this.scopeManager.getDeclaredVariables(node);
        }

        return [];
    }

    /**
     * @param {number} index
     * @returns {object | null}
     */
    getNodeByRangeIndex(index) {
        if (!this.ast || !Array.isArray(this.ast.range)) {
            return null;
        }

        let best = null;

        const dfs = (node) => {
            if (!node || typeof node !== "object" || !Array.isArray(node.range)) {
                return;
            }

            const [start, end] = node.range;

            if (index < start || index >= end) {
                return;
            }

            best = node;

            const keys = childKeysForNode(this._mergedVisitorKeys, node);

            for (const key of keys) {
                const child = node[key];

                if (!child) {
                    continue;
                }

                if (Array.isArray(child)) {
                    for (const c of child) {
                        dfs(c);
                    }
                } else if (typeof child === "object") {
                    dfs(child);
                }
            }
        };

        dfs(this.ast);

        return best;
    }

    /**
     * @param {object} node
     * @returns {object | null}
     */
    getScope(node) {
        if (!this.scopeManager || !node) {
            return null;
        }

        if (typeof this.scopeManager.acquire === "function") {
            return this.scopeManager.acquire(node, true);
        }

        if (typeof this.scopeManager.getScope === "function") {
            return this.scopeManager.getScope(node);
        }

        return null;
    }

    /**
     * @param {object} node
     * @returns {boolean}
     */
    isGlobalReference(node) {
        if (!this.scopeManager || !node || node.type !== "Identifier") {
            return false;
        }

        const scopes = this.scopeManager.scopes;

        if (!Array.isArray(scopes)) {
            return false;
        }

        for (const scope of scopes) {
            if (!scope || !Array.isArray(scope.references)) {
                continue;
            }

            for (const ref of scope.references) {
                if (ref.identifier === node) {
                    if (ref.resolved === null) {
                        return true;
                    }

                    return Boolean(
                        ref.resolved.scope && ref.resolved.scope.type === "global"
                    );
                }
            }
        }

        return false;
    }

    /**
     * @param {string} name
     * @param {object} refNode
     * @returns {boolean}
     */
    markVariableAsUsed(name, refNode) {
        if (!this.scopeManager || typeof name !== "string" || !refNode) {
            return false;
        }

        let scope = null;

        if (typeof this.scopeManager.acquire === "function") {
            scope = this.scopeManager.acquire(refNode, true);
        }

        while (scope) {
            if (scope.set && typeof scope.set.get === "function") {
                const variable = scope.set.get(name);

                if (variable) {
                    variable.eslintUsed = true;

                    return true;
                }
            }

            scope = scope.upper || null;
        }

        return false;
    }

    /**
     * @param {object} first
     * @param {object} second
     * @returns {boolean}
     */
    isSpaceBetween(first, second) {
        const r1 = this.getRange(first);
        const r2 = this.getRange(second);

        if (!r1 || !r2) {
            return false;
        }

        const forward = r1[0] <= r2[0];
        const lo = forward ? r1[1] : r2[1];
        const hi = forward ? r2[0] : r1[0];

        if (hi <= lo) {
            return false;
        }

        const slice = this.text.slice(lo, hi);

        return /\s/u.test(slice);
    }

    /**
     * @param {object} [root]
     * @returns {IterableIterator<{ node: object, parent: object | null, phase: number }>}
     */
    *traverse(root) {
        const start = root !== undefined ? root : this.ast;
        const mergedKeys = this._mergedVisitorKeys;

        const visit = function* (node, parent) {
            if (!node || typeof node !== "object") {
                return;
            }

            if (node.type) {
                yield { node, parent, phase: 1 };
            }

            const keys = childKeysForNode(mergedKeys, node);

            for (const key of keys) {
                const child = node[key];

                if (!child) {
                    continue;
                }

                if (Array.isArray(child)) {
                    for (const c of child) {
                        yield* visit(c, node);
                    }
                } else if (typeof child === "object") {
                    yield* visit(child, node);
                }
            }

            if (node.type) {
                yield { node, parent, phase: 2 };
            }
        };

        yield* visit(start, null);
    }
}

module.exports = { SourceCode };
