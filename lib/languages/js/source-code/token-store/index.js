"use strict";

/**
 * @typedef {{ type: string, value: string, range: [number, number], loc: { start: { line: number, column: number }, end: { line: number, column: number } } }} TokenLike
 */

/**
 * @param {TokenLike[]} itemsA
 * @param {TokenLike[]} itemsB
 * @returns {TokenLike[]}
 */
function mergeSortedByRange(itemsA, itemsB) {
    const out = [];
    let i = 0;
    let j = 0;

    while (i < itemsA.length && j < itemsB.length) {
        const a = itemsA[i];
        const b = itemsB[j];
        const cmp = a.range[0] - b.range[0];

        if (cmp < 0 || (cmp === 0 && a.range[1] <= b.range[1])) {
            out.push(a);
            i++;
        } else {
            out.push(b);
            j++;
        }
    }

    while (i < itemsA.length) {
        out.push(itemsA[i++]);
    }
    while (j < itemsB.length) {
        out.push(itemsB[j++]);
    }

    return out;
}

/**
 * @param {TokenLike[]} sortedByStart
 * @param {number} offset
 * @returns {number}
 */
function lowerBoundByStart(sortedByStart, offset) {
    let lo = 0;
    let hi = sortedByStart.length;

    while (lo < hi) {
        const mid = (lo + hi) >> 1;

        if (sortedByStart[mid].range[0] < offset) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    return lo;
}

/**
 * @param {TokenLike[]} sortedByStart
 * @param {number} offset
 * @returns {number}
 */
function upperBoundByStart(sortedByStart, offset) {
    let lo = 0;
    let hi = sortedByStart.length;

    while (lo < hi) {
        const mid = (lo + hi) >> 1;

        if (sortedByStart[mid].range[0] <= offset) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    return lo;
}

/**
 * @param {TokenLike} t
 * @param {number} start
 * @param {number} end
 * @returns {boolean}
 */
function overlapsRange(t, start, end) {
    return t.range[0] < end && t.range[1] > start;
}

/**
 * @param {TokenLike[]} sortedByStart
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function firstOverlappingIndex(sortedByStart, start, end) {
    const n = sortedByStart.length;
    let lo = lowerBoundByStart(sortedByStart, start);

    if (lo > 0) {
        const prev = sortedByStart[lo - 1];

        if (overlapsRange(prev, start, end)) {
            return lo - 1;
        }
    }

    for (let i = lo; i < n; i++) {
        if (sortedByStart[i].range[0] >= end) {
            break;
        }
        if (overlapsRange(sortedByStart[i], start, end)) {
            return i;
        }
    }

    return -1;
}

/**
 * @param {TokenLike[]} sortedByStart
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function lastOverlappingIndex(sortedByStart, start, end) {
    const first = firstOverlappingIndex(sortedByStart, start, end);

    if (first === -1) {
        return -1;
    }

    const n = sortedByStart.length;
    let last = first;

    for (let i = first + 1; i < n; i++) {
        if (sortedByStart[i].range[0] >= end) {
            break;
        }
        if (overlapsRange(sortedByStart[i], start, end)) {
            last = i;
        }
    }

    return last;
}

/**
 * @param {unknown} options
 * @returns {{ skip: number, filter: ((t: TokenLike) => boolean) | null, includeComments: boolean, count: number | undefined }}
 */
function normalizeOptions(options) {
    if (!options) {
        return { skip: 0, filter: null, includeComments: false, count: undefined };
    }

    return {
        skip: typeof options.skip === "number" && options.skip > 0 ? options.skip : 0,
        filter: typeof options.filter === "function" ? options.filter : null,
        includeComments: Boolean(options.includeComments),
        count: typeof options.count === "number" ? options.count : undefined
    };
}

/**
 * @param {TokenLike[]} stream
 * @param {number} startIndex
 * @param {number} direction -1 backward, 1 forward
 * @param {{ skip: number, filter: ((t: TokenLike) => boolean) | null, count: number | undefined }} opts
 * @returns {TokenLike | null}
 */
function walkStream(stream, startIndex, direction, opts) {
    let i = startIndex;
    let skipped = 0;
    let taken = 0;
    const wantCount = opts.count === undefined ? 1 : opts.count;

    while (i >= 0 && i < stream.length) {
        const t = stream[i];

        if (!opts.filter || opts.filter(t)) {
            if (skipped < opts.skip) {
                skipped++;
            } else {
                taken++;
                if (taken >= wantCount) {
                    return t;
                }
            }
        }
        i += direction;
    }

    return null;
}

class TokenStore {
    /**
     * @param {TokenLike[]} tokens
     * @param {TokenLike[]} comments
     */
    constructor(tokens, comments) {
        this._tokens = Array.isArray(tokens) ? tokens.slice() : [];
        this._comments = Array.isArray(comments) ? comments.slice() : [];
        this._merged = mergeSortedByRange(this._tokens, this._comments);
    }

    /**
     * @param {boolean} includeComments
     * @returns {TokenLike[]}
     */
    _stream(includeComments) {
        return includeComments ? this._merged : this._tokens;
    }

    /**
     * @param {boolean} includeComments
     * @param {number} start
     * @param {number} end
     * @returns {[number, number]}
     */
    _spanIndices(includeComments, start, end) {
        const stream = this._stream(includeComments);
        const first = firstOverlappingIndex(stream, start, end);
        const last = first === -1 ? -1 : lastOverlappingIndex(stream, start, end);

        return [first, last];
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} node
     * @param {unknown} options
     * @returns {TokenLike[]}
     */
    getTokens(node, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!node || !Array.isArray(node.range) || node.range.length < 2) {
            return [];
        }

        const [start, end] = node.range;
        const [first, last] = this._spanIndices(opts.includeComments, start, end);

        if (first === -1 || last === -1) {
            return [];
        }

        const out = [];

        for (let i = first; i <= last; i++) {
            const t = stream[i];

            if (opts.filter && !opts.filter(t)) {
                continue;
            }
            out.push(t);
        }

        if (opts.skip > 0) {
            out.splice(0, opts.skip);
        }

        if (opts.count !== undefined) {
            return out.slice(0, opts.count);
        }

        return out;
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} node
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getFirstToken(node, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!node || !Array.isArray(node.range) || node.range.length < 2) {
            return null;
        }

        const [start, end] = node.range;
        const idx = firstOverlappingIndex(stream, start, end);

        if (idx === -1) {
            return null;
        }

        return walkStream(stream, idx, 1, opts);
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} node
     * @param {unknown} options
     */
    getLastToken(node, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!node || !Array.isArray(node.range) || node.range.length < 2) {
            return null;
        }

        const [start, end] = node.range;
        const idx = lastOverlappingIndex(stream, start, end);

        if (idx === -1) {
            return null;
        }

        return walkStream(stream, idx, -1, opts);
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} nodeOrToken
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getTokenBefore(nodeOrToken, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!nodeOrToken || !Array.isArray(nodeOrToken.range) || nodeOrToken.range.length < 2) {
            return null;
        }

        const start = nodeOrToken.range[0];
        let idx = lowerBoundByStart(stream, start) - 1;

        if (idx < 0) {
            return null;
        }

        return walkStream(stream, idx, -1, opts);
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} nodeOrToken
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getTokenAfter(nodeOrToken, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!nodeOrToken || !Array.isArray(nodeOrToken.range) || nodeOrToken.range.length < 2) {
            return null;
        }

        const end = nodeOrToken.range[1];
        let idx = lowerBoundByStart(stream, end);

        while (idx < stream.length && stream[idx].range[0] < end) {
            idx++;
        }

        if (idx >= stream.length) {
            return null;
        }

        return walkStream(stream, idx, 1, opts);
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} left
     * @param {{ type?: string, range?: [number, number] }} right
     * @param {unknown} options
     * @returns {TokenLike[]}
     */
    getTokensBetween(left, right, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        if (!left || !right || !Array.isArray(left.range) || !Array.isArray(right.range)) {
            return [];
        }

        const leftEnd = left.range[1];
        const rightStart = right.range[0];

        if (rightStart < leftEnd) {
            return [];
        }

        let lo = lowerBoundByStart(stream, leftEnd);

        while (lo < stream.length && stream[lo].range[0] < leftEnd) {
            lo++;
        }

        const hiExclusive = lowerBoundByStart(stream, rightStart);
        const out = [];

        for (let i = lo; i < hiExclusive; i++) {
            const t = stream[i];

            if (opts.filter && !opts.filter(t)) {
                continue;
            }
            out.push(t);
        }

        if (opts.skip > 0) {
            out.splice(0, opts.skip);
        }

        if (opts.count !== undefined) {
            return out.slice(0, opts.count);
        }

        return out;
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} left
     * @param {{ type?: string, range?: [number, number] }} right
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getFirstTokenBetween(left, right, options) {
        const tokens = this.getTokensBetween(left, right, options);

        return tokens.length ? tokens[0] : null;
    }

    /**
     * @param {{ type?: string, range?: [number, number] }} left
     * @param {{ type?: string, range?: [number, number] }} right
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getLastTokenBetween(left, right, options) {
        const tokens = this.getTokensBetween(left, right, options);

        return tokens.length ? tokens[tokens.length - 1] : null;
    }

    /**
     * @param {number} offset
     * @param {unknown} options
     * @returns {TokenLike | null}
     */
    getTokenByRangeStart(offset, options) {
        const opts = normalizeOptions(options);
        const stream = this._stream(opts.includeComments);

        let idx = lowerBoundByStart(stream, offset);

        if (idx < stream.length && stream[idx].range[0] === offset) {
            return walkStream(stream, idx, 1, opts);
        }

        idx = upperBoundByStart(stream, offset) - 1;

        if (idx >= 0 && stream[idx].range[0] === offset) {
            return walkStream(stream, idx, 1, opts);
        }

        return null;
    }
}

module.exports = { TokenStore };
