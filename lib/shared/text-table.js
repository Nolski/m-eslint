"use strict";

/**
 * @param {string[][]} rows
 * @param {{ align?: ("left"|"right")[], separator?: string }} [options]
 * @returns {string}
 */
function textTable(rows, options) {
    const align = options && options.align ? options.align : [];
    const separator = options && options.separator !== undefined ? options.separator : "  ";

    if (rows.length === 0) {
        return "";
    }

    let columnCount = 0;

    for (const row of rows) {
        columnCount = Math.max(columnCount, row.length);
    }

    const widths = new Array(columnCount).fill(0);

    for (const row of rows) {
        for (let i = 0; i < row.length; i++) {
            const cell = String(row[i] === undefined || row[i] === null ? "" : row[i]);

            widths[i] = Math.max(widths[i], cell.length);
        }
    }

    const lines = [];

    for (const row of rows) {
        const padded = [];

        for (let i = 0; i < columnCount; i++) {
            const raw = i < row.length ? row[i] : "";
            const cell = String(raw === undefined || raw === null ? "" : raw);
            const width = widths[i];
            const alignment = align[i] || "left";
            const filled = alignment === "right" ? cell.padStart(width) : cell.padEnd(width);

            padded.push(filled);
        }
        lines.push(padded.join(separator));
    }

    return lines.join("\n");
}

module.exports = { textTable };
