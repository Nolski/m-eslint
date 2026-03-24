"use strict";

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeCommentText(value) {
    return String(value)
        .replace(/^\s*\/\*/u, "")
        .replace(/\*\/\s*$/u, "")
        .replace(/^\s*\/\//u, "")
        .replace(/^\s*<!--/u, "")
        .replace(/-->\s*$/u, "")
        .replace(/^\s*\*\s?/gm, "")
        .trim();
}

/**
 * @param {string} rest
 * @returns {string[]}
 */
function splitRuleIds(rest) {
    const trimmed = rest.trim();

    if (!trimmed) {
        return [];
    }

    return trimmed.split(/[,\s]+/u).filter(Boolean);
}

/**
 * Parse the body of an ESLint directive comment.
 *
 * @param {string} value
 * @returns {{ type: string, value: string, ruleIds?: string[] }}
 */
function parseDirectiveComment(value) {
    const normalized = normalizeCommentText(value);
    const trimmed = normalized.trim();

    if (!/^eslint\b/iu.test(trimmed)) {
        return { type: "unknown", value: trimmed };
    }

    const withoutPrefix = trimmed.replace(/^eslint\s*/iu, "").trim();
    const lower = withoutPrefix.toLowerCase();

    if (lower.startsWith("disable-next-line")) {
        const tail = withoutPrefix.slice("disable-next-line".length);

        return {
            type: "disable-next-line",
            value: trimmed,
            ruleIds: splitRuleIds(tail)
        };
    }

    if (lower.startsWith("disable-line")) {
        const tail = withoutPrefix.slice("disable-line".length);

        return {
            type: "disable-line",
            value: trimmed,
            ruleIds: splitRuleIds(tail)
        };
    }

    if (lower.startsWith("disable")) {
        const tail = withoutPrefix.slice("disable".length);

        return {
            type: "disable",
            value: trimmed,
            ruleIds: splitRuleIds(tail)
        };
    }

    if (lower.startsWith("enable")) {
        const tail = withoutPrefix.slice("enable".length);

        return {
            type: "enable",
            value: trimmed,
            ruleIds: splitRuleIds(tail)
        };
    }

    return {
        type: "eslint",
        value: trimmed,
        ruleIds: []
    };
}

module.exports = { parseDirectiveComment };
