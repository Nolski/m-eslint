"use strict";

/**
 * Apply non-overlapping fixes from lint messages in source order.
 *
 * @param {string} sourceText
 * @param {ReadonlyArray<{ fix?: { range: [number, number], text: string } }>} messages
 * @returns {{ fixed: boolean, output: string, messages: typeof messages }}
 */
function applyFixes(sourceText, messages) {
    const withFix = messages
        .map((message, index) => ({ message, index }))
        .filter(({ message }) => message && message.fix && Array.isArray(message.fix.range));

    withFix.sort((a, b) => a.message.fix.range[0] - b.message.fix.range[0]);

    const appliedIndices = new Set();
    const appliedFixes = [];
    let prevEnd = -1;

    for (const { message, index } of withFix) {
        const range = message.fix.range;
        const start = range[0];
        const end = range[1];

        if (start < prevEnd) {
            continue;
        }

        appliedFixes.push({ start, end, text: message.fix.text, index });
        prevEnd = end;
        appliedIndices.add(index);
    }

    if (appliedFixes.length === 0) {
        return {
            fixed: false,
            output: sourceText,
            messages
        };
    }

    let out = "";
    let cursor = 0;

    for (const { start, end, text } of appliedFixes) {
        if (start > cursor) {
            out += sourceText.slice(cursor, start);
        }
        out += text;
        cursor = end;
    }

    if (cursor < sourceText.length) {
        out += sourceText.slice(cursor);
    }

    const remainingMessages = messages.filter((_, i) => !appliedIndices.has(i));

    return {
        fixed: true,
        output: out,
        messages: remainingMessages
    };
}

module.exports = {
    applyFixes
};
