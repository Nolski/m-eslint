"use strict";

const { createRuleFixer } = require("./rule-fixer.js");

/**
 * @param {string} template
 * @param {Record<string, unknown>|undefined} data
 * @returns {string}
 */
function interpolateMessage(template, data) {
    if (!data) {
        return template;
    }
    return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, key) => {
        const k = String(key).trim();

        if (Object.prototype.hasOwnProperty.call(data, k)) {
            return String(data[k]);
        }
        return match;
    });
}

/**
 * @param {object} descriptor
 * @returns {{ line: number, column: number, endLine: number, endColumn: number }}
 */
function resolveLocation(descriptor) {
    if (descriptor.node && descriptor.node.loc) {
        const start = descriptor.node.loc.start;
        const end = descriptor.node.loc.end || start;

        return {
            line: start.line,
            column: start.column,
            endLine: end.line,
            endColumn: end.column
        };
    }

    if (descriptor.loc) {
        const start = descriptor.loc.start || descriptor.loc;
        const end = descriptor.loc.end || start;

        return {
            line: start.line,
            column: start.column,
            endLine: end.line,
            endColumn: end.column
        };
    }

    return {
        line: 1,
        column: 0,
        endLine: 1,
        endColumn: 0
    };
}

class RuleContext {
    /**
     * @param {{
     *   rule: object,
     *   ruleId: string,
     *   severity: number,
     *   options: unknown,
     *   sourceCode: object,
     *   settings: Record<string, unknown>,
     *   filename: string,
     *   physicalFilename: string,
     *   cwd: string,
     *   languageOptions: object,
     *   reportHandler: (message: object) => void
     * }} params
     */
    constructor(params) {
        const {
            rule,
            ruleId,
            severity,
            options,
            sourceCode,
            settings,
            filename,
            physicalFilename,
            cwd,
            languageOptions,
            reportHandler
        } = params;

        this.id = ruleId;
        this.options = options;
        this.sourceCode = sourceCode;
        this.cwd = cwd;
        this.filename = filename;
        this.physicalFilename = physicalFilename;
        this.languageOptions = languageOptions;
        this.settings = settings;

        /** @private */
        this._rule = rule;
        /** @private */
        this._severity = severity;
        /** @private */
        this._reportHandler = reportHandler;
    }

    /**
     * @param {{
     *   node?: object,
     *   loc?: object,
     *   message?: string,
     *   messageId?: string,
     *   data?: Record<string, unknown>,
     *   fix?: unknown,
     *   suggest?: ReadonlyArray<{ desc: string, fix: (fixer: ReturnType<typeof createRuleFixer>) => unknown }>
     * }} descriptor
     */
    report(descriptor) {
        const rule = this._rule;
        const meta = rule && rule.meta ? rule.meta : {};
        const messages = meta.messages || {};

        let messageText = "";

        if (descriptor.messageId && Object.prototype.hasOwnProperty.call(messages, descriptor.messageId)) {
            messageText = interpolateMessage(
                String(messages[descriptor.messageId]),
                descriptor.data
            );
        } else if (typeof descriptor.message === "string") {
            messageText = descriptor.message;
        } else {
            messageText = "";
        }

        const { line, column, endLine, endColumn } = resolveLocation(descriptor);

        /** @type {object} */
        const lintMessage = {
            ruleId: this.id,
            severity: this._severity,
            message: messageText,
            line,
            column,
            endLine,
            endColumn,
            nodeType: descriptor.node && descriptor.node.type ? descriptor.node.type : void 0
        };

        if (descriptor.messageId) {
            lintMessage.messageId = descriptor.messageId;
        }

        if (meta.fixable && typeof descriptor.fix === "function") {
            const fixer = createRuleFixer();
            const fixResult = descriptor.fix(fixer);
            if (fixResult && fixResult.range && typeof fixResult.text === "string") {
                lintMessage.fix = fixResult;
            } else if (Array.isArray(fixResult)) {
                for (const f of fixResult) {
                    if (f && f.range && typeof f.text === "string") {
                        lintMessage.fix = f;
                        break;
                    }
                }
            }
        } else if (meta.fixable && descriptor.fix && typeof descriptor.fix === "object") {
            lintMessage.fix = descriptor.fix;
        }

        if (meta.hasSuggestions && Array.isArray(descriptor.suggest) && descriptor.suggest.length > 0) {
            const fixer = createRuleFixer();
            const suggestions = [];

            for (const entry of descriptor.suggest) {
                if (!entry || typeof entry.fix !== "function") {
                    continue;
                }
                const fixResult = entry.fix(fixer);

                if (fixResult && fixResult.range && typeof fixResult.text === "string") {
                    suggestions.push({
                        desc: typeof entry.desc === "string" ? entry.desc : "",
                        fix: fixResult
                    });
                }
            }
            if (suggestions.length > 0) {
                lintMessage.suggestions = suggestions;
            }
        }

        this._reportHandler(lintMessage);
    }
}

module.exports = {
    RuleContext
};
