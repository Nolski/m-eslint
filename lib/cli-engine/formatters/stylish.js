"use strict";

const chalk = require("chalk");
const path = require("node:path");

/**
 * @param {object[]} results
 * @param {object} [_data]
 * @returns {string}
 */
function format(results, _data) {
    let out = "";
    let totalErrors = 0;
    let totalWarnings = 0;
    let fixableCount = 0;

    for (const result of results) {
        const messages = result.messages || [];

        if (messages.length === 0) {
            continue;
        }

        const rel = result.filePath ? path.relative(process.cwd(), result.filePath) : result.filePath;

        out += `${chalk.underline(rel)}\n`;

        for (const m of messages) {
            const line = m.line != null ? m.line : 0;
            const col = m.column != null ? m.column : 0;
            const sev = m.fatal || m.severity === 2 ? "error" : m.severity === 1 ? "warning" : "info";
            const sevLabel =
                sev === "error"
                    ? chalk.red("error")
                    : sev === "warning"
                      ? chalk.yellow("warning")
                      : chalk.blue("info");
            const rule = m.ruleId ? chalk.dim(` ${m.ruleId}`) : "";

            if (m.fix) {
                fixableCount++;
            }
            if (sev === "error" || m.fatal) {
                totalErrors++;
            } else if (sev === "warning") {
                totalWarnings++;
            }

            out += `  ${line}:${col}  ${sevLabel}  ${m.message}${rule}\n`;
        }

        out += "\n";
    }

    const summaryParts = [];

    if (totalErrors > 0) {
        summaryParts.push(chalk.red(`${totalErrors} error${totalErrors === 1 ? "" : "s"}`));
    }
    if (totalWarnings > 0) {
        summaryParts.push(chalk.yellow(`${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}`));
    }

    if (summaryParts.length > 0) {
        out += summaryParts.join(" and ") + "\n";
    }

    if (fixableCount > 0) {
        out += chalk.dim(
            `\n${fixableCount} problem${fixableCount === 1 ? "" : "s"} potentially fixable with the \`--fix\` option.\n`
        );
    }

    return out;
}

module.exports = { format };
