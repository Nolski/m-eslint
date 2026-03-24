"use strict";

const path = require("node:path");

/**
 * @param {object[]} results
 * @param {object} [_data]
 * @returns {string}
 */
function format(results, _data) {
    let errors = 0;
    let warnings = 0;

    for (const r of results) {
        for (const m of r.messages || []) {
            if (m.fatal || m.severity === 2) {
                errors++;
            } else if (m.severity === 1) {
                warnings++;
            }
        }
    }

    let rows = "";

    for (const result of results) {
        const messages = result.messages || [];
        const rel = result.filePath ? path.relative(process.cwd(), result.filePath) : result.filePath;

        for (const m of messages) {
            const line = m.line != null ? m.line : "";
            const col = m.column != null ? m.column : "";
            const sev = m.fatal || m.severity === 2 ? "error" : m.severity === 1 ? "warning" : "info";
            const sevClass =
                sev === "error" ? "sev-error" : sev === "warning" ? "sev-warning" : "sev-info";

            rows += `<tr class="${sevClass}"><td>${escapeHtml(rel)}</td><td>${line}</td><td>${col}</td><td>${escapeHtml(
                sev
            )}</td><td>${escapeHtml(m.message)}</td><td>${escapeHtml(m.ruleId || "")}</td></tr>\n`;
        }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>ESLint Report</title>
<style>
body { font-family: system-ui, sans-serif; margin: 1rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }
th { background: #f0f0f0; }
.sev-error { background: #ffe0e0; }
.sev-warning { background: #fff8e0; }
.sev-info { background: #e8f4ff; }
.summary { margin-bottom: 1rem; }
</style>
</head>
<body>
<h1>ESLint Report</h1>
<div class="summary"><strong>${errors}</strong> errors, <strong>${warnings}</strong> warnings</div>
<table>
<thead><tr><th>File</th><th>Line</th><th>Column</th><th>Severity</th><th>Message</th><th>Rule</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>
`;
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeHtml(s) {
    return String(s)
        .replace(/&/gu, "&amp;")
        .replace(/</gu, "&lt;")
        .replace(/>/gu, "&gt;")
        .replace(/"/gu, "&quot;");
}

module.exports = { format };
