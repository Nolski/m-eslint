"use strict";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isMergeableObject(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const proto = Object.getPrototypeOf(value);

    return proto === Object.prototype || proto === null;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function cloneLeaf(value) {
    if (Array.isArray(value)) {
        return value.slice();
    }
    if (isMergeableObject(value)) {
        return deepMerge(value, Object.create(null));
    }
    return value;
}

/**
 * Deep-merge two values into a new object with a null prototype.
 * Arrays are replaced entirely (not concatenated). Primitives are overridden by `source`.
 *
 * @param {unknown} target
 * @param {unknown} source
 * @returns {unknown}
 */
function deepMerge(target, source) {
    if (source === undefined) {
        return cloneLeaf(target);
    }
    if (target === undefined || target === null) {
        return cloneLeaf(source);
    }
    if (Array.isArray(source)) {
        return source.slice();
    }
    if (!isMergeableObject(target) || !isMergeableObject(source)) {
        return cloneLeaf(source);
    }

    const result = Object.create(null);
    const keySet = new Set([
        ...Object.keys(target),
        ...Object.keys(source)
    ]);

    for (const key of keySet) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) {
            result[key] = cloneLeaf(target[key]);
            continue;
        }
        const sourceVal = source[key];

        if (Array.isArray(sourceVal)) {
            result[key] = sourceVal.slice();
            continue;
        }
        if (isMergeableObject(target[key]) && isMergeableObject(sourceVal)) {
            result[key] = deepMerge(target[key], sourceVal);
            continue;
        }
        result[key] = cloneLeaf(sourceVal);
    }

    return result;
}

module.exports = { deepMerge };
