"use strict";

const espree = require("espree");
const esquery = require("esquery");
const Ajv = require("ajv");
const { KEYS, getKeys } = require("eslint-visitor-keys");
const { normalizeSeverity } = require("../shared/severity.js");
const { RuleContext } = require("./file-context.js");
const { createTimingData } = require("./timing.js");
const { applyFixes } = require("./source-code-fixer.js");

const { SourceCode: FullSourceCode } = require("../languages/js/source-code/source-code.js");
const pkg = require("../../package.json");

const _schemaValidatorCache = new Map();

let _builtinRules = null;
function getBuiltinRules() {
    if (!_builtinRules) {
        _builtinRules = require("../rules/index.js");
    }
    return _builtinRules;
}

const ajv = new Ajv({ allErrors: true });

function mergeDefaultOptions(defaults, userOptions) {
    const result = [];
    const len = Math.max(defaults.length, userOptions.length);
    for (let i = 0; i < len; i++) {
        const def = i < defaults.length ? defaults[i] : undefined;
        const usr = i < userOptions.length ? userOptions[i] : undefined;
        if (usr === undefined) {
            result.push(def);
        } else if (def && typeof def === "object" && !Array.isArray(def) && usr && typeof usr === "object" && !Array.isArray(usr)) {
            result.push({ ...def, ...usr });
        } else {
            result.push(usr);
        }
    }
    return result;
}

const SIMPLE_VISITOR_KEY = /^[A-Za-z][A-Za-z0-9]*$/u;

/**
 * @param {string} key
 * @returns {{ selectorText: string, isExit: boolean, isComplex: boolean, simpleType: string|null }}
 */
function parseVisitorKey(key) {
    let isExit = false;
    let base = key;

    if (key.endsWith(":exit")) {
        isExit = true;
        base = key.slice(0, -":exit".length);
    }

    const isComplex = !SIMPLE_VISITOR_KEY.test(base);

    return {
        selectorText: base,
        isExit,
        isComplex,
        simpleType: isComplex ? null : base
    };
}

/**
 * @param {unknown} config
 * @returns {object[]}
 */
function normalizeConfigArray(config) {
    if (Array.isArray(config)) {
        return config;
    }
    return [config];
}

/**
 * @param {object[]} configs
 * @returns {object}
 */
function mergeConfigs(configs) {
    const merged = {
        rules: {},
        ruleDefinitions: {},
        languageOptions: {},
        settings: {},
        plugins: [],
        parser: null
    };

    for (const c of configs) {
        if (!c || typeof c !== "object") {
            continue;
        }
        Object.assign(merged.rules, c.rules || {});
        Object.assign(merged.ruleDefinitions, c.ruleDefinitions || {});
        Object.assign(merged.languageOptions, c.languageOptions || {});
        Object.assign(merged.settings, c.settings || {});
        if (Array.isArray(c.plugins)) {
            merged.plugins.push(...c.plugins);
        }
        if (c.parser) {
            merged.parser = c.parser;
        }
    }
    return merged;
}

/**
 * @param {unknown} entry
 * @returns {[number, ...unknown[]]}
 */
function normalizeRuleEntry(entry) {
    if (Array.isArray(entry)) {
        const severity = normalizeSeverity(entry[0]);
        return [severity, ...entry.slice(1)];
    }
    return [normalizeSeverity(entry)];
}

/**
 * @param {string} ruleId
 * @param {object} mergedConfig
 * @returns {object|null}
 */
function resolveRuleModule(ruleId, mergedConfig) {
    for (const plugin of mergedConfig.plugins || []) {
        if (plugin && plugin.rules && plugin.rules[ruleId]) {
            return plugin.rules[ruleId];
        }
    }
    if (mergedConfig.ruleDefinitions && mergedConfig.ruleDefinitions[ruleId]) {
        return mergedConfig.ruleDefinitions[ruleId];
    }
    const builtins = getBuiltinRules();
    if (builtins[ruleId]) {
        return builtins[ruleId];
    }
    return null;
}

/**
 * @param {object} ast
 */
function assignParents(ast) {
    const visit = (node, parent) => {
        if (!node || typeof node !== "object") {
            return;
        }
        Object.defineProperty(node, "parent", {
            configurable: true,
            enumerable: false,
            value: parent,
            writable: true
        });

        const typeKeys = KEYS[node.type] || getKeys(node);

        for (const key of typeKeys) {
            const value = node[key];

            if (Array.isArray(value)) {
                for (const child of value) {
                    visit(child, node);
                }
            } else if (value && typeof value === "object" && typeof value.type === "string") {
                visit(value, node);
            }
        }
    };

    visit(ast, null);
}

/**
 * @param {object} visitor
 * @param {object} ast
 * @returns {Array<{ fn: Function, isExit: boolean, isComplex: boolean, simpleType: string|null, matched?: WeakSet<object> }>}
 */
function buildVisitorRegistry(visitor, ast) {
    const registry = [];

    for (const key of Object.keys(visitor)) {
        const fn = visitor[key];

        if (typeof fn !== "function") {
            continue;
        }

        const parsed = parseVisitorKey(key);

        if (parsed.isComplex) {
            const selector = esquery.parse(parsed.selectorText);
            const matchedNodes = esquery.match(ast, selector);
            const matched = new WeakSet(matchedNodes);

            registry.push({
                fn,
                isExit: parsed.isExit,
                isComplex: true,
                simpleType: null,
                matched
            });
        } else {
            registry.push({
                fn,
                isExit: parsed.isExit,
                isComplex: false,
                simpleType: parsed.simpleType,
                matched: void 0
            });
        }
    }
    return registry;
}

/**
 * @param {object} node
 * @param {ReturnType<typeof buildVisitorRegistry>} registry
 */
function runVisitorsEnter(node, registry) {
    for (const reg of registry) {
        if (reg.isExit) {
            continue;
        }
        if (reg.isComplex) {
            if (reg.matched && reg.matched.has(node)) {
                reg.fn(node);
            }
        } else if (reg.simpleType && node.type === reg.simpleType) {
            reg.fn(node);
        }
    }
}

/**
 * @param {object} node
 * @param {ReturnType<typeof buildVisitorRegistry>} registry
 */
function runVisitorsExit(node, registry) {
    for (const reg of registry) {
        if (!reg.isExit) {
            continue;
        }
        if (reg.isComplex) {
            if (reg.matched && reg.matched.has(node)) {
                reg.fn(node);
            }
        } else if (reg.simpleType && node.type === reg.simpleType) {
            reg.fn(node);
        }
    }
}

/**
 * @param {object} node
 * @param {ReturnType<typeof buildVisitorRegistry>} registry
 */
function traverseAst(node, registry) {
    if (!node || typeof node !== "object") {
        return;
    }

    runVisitorsEnter(node, registry);

    const typeKeys = KEYS[node.type] || getKeys(node);

    for (const key of typeKeys) {
        const value = node[key];

        if (Array.isArray(value)) {
            for (const child of value) {
                traverseAst(child, registry);
            }
        } else if (value && typeof value === "object" && typeof value.type === "string") {
            traverseAst(value, registry);
        }
    }

    runVisitorsExit(node, registry);
}

/**
 * Single-pass combined AST traversal that dispatches to all rule listeners.
 * Replaces per-rule traverseAst calls: O(M + N) instead of O(N × M).
 */
function traverseAstCombined(node, enterSimple, exitSimple, enterComplex, exitComplex) {
    if (!node || typeof node !== "object") {
        return;
    }

    const nodeType = node.type;

    if (nodeType) {
        const enterFns = enterSimple.get(nodeType);

        if (enterFns) {
            for (let i = 0; i < enterFns.length; i++) {
                enterFns[i](node);
            }
        }
        for (let i = 0; i < enterComplex.length; i++) {
            const reg = enterComplex[i];

            if (reg.matched && reg.matched.has(node)) {
                reg.fn(node);
            }
        }
    }

    const typeKeys = KEYS[nodeType] || getKeys(node);

    for (const key of typeKeys) {
        const value = node[key];

        if (Array.isArray(value)) {
            for (const child of value) {
                traverseAstCombined(child, enterSimple, exitSimple, enterComplex, exitComplex);
            }
        } else if (value && typeof value === "object" && typeof value.type === "string") {
            traverseAstCombined(value, enterSimple, exitSimple, enterComplex, exitComplex);
        }
    }

    if (nodeType) {
        const exitFns = exitSimple.get(nodeType);

        if (exitFns) {
            for (let i = 0; i < exitFns.length; i++) {
                exitFns[i](node);
            }
        }
        for (let i = 0; i < exitComplex.length; i++) {
            const reg = exitComplex[i];

            if (reg.matched && reg.matched.has(node)) {
                reg.fn(node);
            }
        }
    }
}

class SourceCode extends FullSourceCode {}

/**
 * @param {string} value
 * @returns {string[]}
 */
function parseRuleListFromDirective(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return [];
    }
    return trimmed.split(/\s*,\s*/u).filter(Boolean);
}

/**
 * @param {object[]} comments
 * @returns {{ regions: Array<{ startLine: number, endLine: number, rules: Set<string>|null }> }}
 */
function buildDisableRegions(comments) {
    const regions = [];
    let blockStartLine = null;
    let blockRules = null;

    const sorted = comments.slice().sort((a, b) => {
        const la = a.loc && a.loc.start ? a.loc.start.line : 0;
        const lb = b.loc && b.loc.start ? b.loc.start.line : 0;

        return la - lb;
    });

    for (const comment of sorted) {
        const raw = typeof comment.value === "string" ? comment.value : "";
        const line = comment.loc && comment.loc.start ? comment.loc.start.line : 1;
        const isBlock = comment.type === "Block";

        if (!isBlock) {
            const lineText = raw;

            if (/^\s*eslint-disable-line\b/u.test(lineText)) {
                const rest = lineText.replace(/^\s*eslint-disable-line\b/u, "");
                const rules = parseRuleListFromDirective(rest.replace(/^\s+/u, ""));

                regions.push({
                    startLine: line,
                    endLine: line,
                    rules: rules.length > 0 ? new Set(rules) : null
                });
                continue;
            }

            if (/^\s*eslint-disable-next-line\b/u.test(lineText)) {
                const rest = lineText.replace(/^\s*eslint-disable-next-line\b/u, "");
                const rules = parseRuleListFromDirective(rest.replace(/^\s+/u, ""));

                regions.push({
                    startLine: line + 1,
                    endLine: line + 1,
                    rules: rules.length > 0 ? new Set(rules) : null
                });
                continue;
            }

            if (
                /^\s*eslint-disable\b/u.test(lineText) &&
                !/eslint-disable-line/u.test(lineText) &&
                !/eslint-disable-next-line/u.test(lineText)
            ) {
                const rest = lineText.replace(/^\s*eslint-disable\s*/u, "");
                const rules = parseRuleListFromDirective(rest);

                blockStartLine = line + 1;
                blockRules = rules.length > 0 ? new Set(rules) : null;
                continue;
            }

            if (/^\s*eslint-enable\b/u.test(lineText) && blockStartLine !== null) {
                const endLine = line - 1;

                if (endLine >= blockStartLine) {
                    regions.push({
                        startLine: blockStartLine,
                        endLine,
                        rules: blockRules
                    });
                }
                blockStartLine = null;
                blockRules = null;
                continue;
            }
        }

        const text = raw.replace(/^\s*/u, "").replace(/\s*$/u, "");

        if (/^eslint-disable\b/u.test(text)) {
            const after = text.replace(/^eslint-disable\b/u, "").trim();
            const rules = parseRuleListFromDirective(after);

            blockStartLine = line + 1;
            blockRules = rules.length > 0 ? new Set(rules) : null;
            continue;
        }

        if (/^eslint-enable\b/u.test(text) && blockStartLine !== null) {
            const endLine = line - 1;

            if (endLine >= blockStartLine) {
                regions.push({
                    startLine: blockStartLine,
                    endLine,
                    rules: blockRules
                });
            }
            blockStartLine = null;
            blockRules = null;
        }
    }

    if (blockStartLine !== null) {
        regions.push({
            startLine: blockStartLine,
            endLine: Number.MAX_SAFE_INTEGER,
            rules: blockRules
        });
    }

    return { regions };
}

/**
 * @param {number} line
 * @param {string|null} ruleId
 * @param {ReturnType<typeof buildDisableRegions>["regions"]} regions
 * @returns {boolean}
 */
function isLineDisabled(line, ruleId, regions) {
    for (const r of regions) {
        if (line >= r.startLine && line <= r.endLine) {
            if (r.rules === null) {
                return true;
            }
            if (ruleId && r.rules.has(ruleId)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * @param {string} text
 * @param {object} mergedConfig
 * @param {boolean} allowInline
 * @returns {object}
 */
function applyInlineRuleComments(text, mergedConfig, allowInline) {
    if (!allowInline) {
        return mergedConfig.rules;
    }

    const rules = { ...mergedConfig.rules };
    const lines = text.split(/\r\n|\r|\n/u);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!/^\s*\/\/\s*eslint\s+/u.test(line) && !/\/\*\s*eslint\s+/u.test(line)) {
            continue;
        }

        const match = line.match(/\beslint\s+(.+?)\s*(?:\*\/\s*)?$/u);

        if (!match) {
            continue;
        }

        let payload = match[1];

        if (payload.includes("*/")) {
            payload = payload.split("*/")[0];
        }

        payload = payload.replace(/\s*$/u, "");

        if (/^(disable|enable)(-line|-next-line)?\b/u.test(payload)) {
            continue;
        }

        const parts = payload.split(/\s*,\s*/u);

        for (const part of parts) {
            const ruleMatch = part.match(/^([@A-Za-z0-9_/-]+)\s*:\s*(off|warn|error|0|1|2)$/u);

            if (ruleMatch) {
                const id = ruleMatch[1];
                const sev = ruleMatch[2];

                rules[id] = [sev];
            }
        }
    }

    return rules;
}

class Linter {
    /**
     * @param {{ cwd?: string, configType?: string, flags?: object|Set<string> }} [options]
     */
    constructor(options = {}) {
        this.cwd = options.cwd || process.cwd();
        this.configType = options.configType || "flat";
        this.flags = options.flags || {};

        /** @type {SourceCode|null} */
        this._lastSourceCode = null;
        /** @type {ReturnType<typeof createTimingData>|null} */
        this._timing = null;
        /** @type {number} */
        this._fixPassCount = 0;
        /** @type {object[]} */
        this._suppressedMessages = [];
    }

    /**
     * @param {string} flag
     * @returns {boolean}
     */
    hasFlag(flag) {
        if (this.flags instanceof Set) {
            return this.flags.has(flag);
        }
        return Boolean(this.flags && this.flags[flag]);
    }

    /**
     * @param {string|SourceCode} textOrSourceCode
     * @param {object|object[]} config
     * @param {string|{ filename?: string, physicalFilename?: string }} [filenameOrOptions]
     * @returns {object[]}
     */
    verify(textOrSourceCode, config, filenameOrOptions) {
        this._timing = createTimingData();
        this._suppressedMessages = [];

        const filenameOpts =
            typeof filenameOrOptions === "string"
                ? { filename: filenameOrOptions, physicalFilename: filenameOrOptions }
                : filenameOrOptions || {};

        const filename = filenameOpts.filename || "<input>";
        const physicalFilename = filenameOpts.physicalFilename || filename;

        const configs = normalizeConfigArray(config);
        let mergedConfig = mergeConfigs(configs);

        const allowInline = !this.hasFlag("no-inline-config");

        let text;
        let sourceCode;

        if (textOrSourceCode instanceof SourceCode) {
            sourceCode = textOrSourceCode;
            text = sourceCode.text;
            mergedConfig = {
                ...mergedConfig,
                rules: applyInlineRuleComments(text, mergedConfig, allowInline)
            };
        } else {
            text = String(textOrSourceCode);
            mergedConfig = {
                ...mergedConfig,
                rules: applyInlineRuleComments(text, mergedConfig, allowInline)
            };

            const languageOptions = mergedConfig.languageOptions || {};
            const parser = mergedConfig.parser || espree;
            const parseOptions = {
                ecmaVersion: languageOptions.ecmaVersion ?? "latest",
                sourceType: languageOptions.sourceType || "module",
                loc: true,
                range: true,
                tokens: true,
                comment: true,
                ...languageOptions.parserOptions
            };

            let parseResult;

            try {
                parseResult =
                    typeof parser.parse === "function"
                        ? parser.parse(text, parseOptions)
                        : parser(text, parseOptions);
            } catch (err) {
                const line = err.lineNumber != null ? err.lineNumber : 1;
                const column = err.column != null ? err.column : 0;

                return [
                    {
                        fatal: true,
                        severity: 2,
                        ruleId: null,
                        message: err.message,
                        line,
                        column
                    }
                ];
            }

            const ast =
                parseResult && parseResult.type === "Program"
                    ? parseResult
                    : parseResult.ast;

            if (!ast.tokens && parseResult.tokens) {
                ast.tokens = parseResult.tokens;
            }
            if (!ast.comments && parseResult.comments) {
                ast.comments = parseResult.comments;
            }

            sourceCode = new SourceCode(text, ast);
        }

        this._lastSourceCode = sourceCode;
        const ast = sourceCode.ast;
        const comments = sourceCode.comments;

        // Finding 3: SourceCode constructor already calls attachParentPointers(),
        // so we skip the redundant assignParents(ast) call here.

        const { regions } = buildDisableRegions(comments);
        const messages = [];

        const mergedRules = mergedConfig.rules || {};

        // Finding 1: Collect all rule visitors first, then do a single combined AST traversal.
        const combinedEnterSimple = new Map();
        const combinedExitSimple = new Map();
        const combinedEnterComplex = [];
        const combinedExitComplex = [];
        const ruleTimings = [];

        for (const ruleId of Object.keys(mergedRules)) {
            const normalized = normalizeRuleEntry(mergedRules[ruleId]);
            const severity = normalized[0];
            const ruleOptions = normalized.slice(1);

            if (severity === 0) {
                continue;
            }

            const ruleModule = resolveRuleModule(ruleId, mergedConfig);

            if (!ruleModule || typeof ruleModule.create !== "function") {
                continue;
            }

            const rule = ruleModule;

            let mergedOptions = ruleOptions;
            if (rule.meta && rule.meta.defaultOptions && Array.isArray(rule.meta.defaultOptions)) {
                mergedOptions = mergeDefaultOptions(rule.meta.defaultOptions, ruleOptions);
            }

            // Finding 4: Cache compiled AJV validators by rule ID
            if (
                rule.meta &&
                rule.meta.schema &&
                Array.isArray(rule.meta.schema) &&
                rule.meta.schema.length > 0
            ) {
                try {
                    let validate = _schemaValidatorCache.get(ruleId);

                    if (!validate) {
                        const wrapperSchema = {
                            type: "array",
                            items: rule.meta.schema,
                            minItems: 0,
                            maxItems: rule.meta.schema.length
                        };

                        validate = ajv.compile(wrapperSchema);
                        _schemaValidatorCache.set(ruleId, validate);
                    }
                    if (!validate(mergedOptions)) {
                        messages.push({
                            ruleId: null,
                            severity: 2,
                            message: `Configuration for rule "${ruleId}" is not valid: ${ajv.errorsText(validate.errors)}`,
                            line: 1,
                            column: 0,
                            endLine: 1,
                            endColumn: 0
                        });
                        continue;
                    }
                } catch (_e) {
                    // schema compilation error - skip validation
                }
            }

            this._timing.startRule(ruleId);

            const reportHandler = (lintMessage) => {
                messages.push(lintMessage);
            };

            const context = new RuleContext({
                rule,
                ruleId,
                severity,
                options: mergedOptions,
                sourceCode,
                settings: mergedConfig.settings || {},
                filename,
                physicalFilename,
                cwd: this.cwd,
                languageOptions: mergedConfig.languageOptions || {},
                reportHandler
            });

            let visitor;

            try {
                visitor = rule.create(context) || {};
            } catch (err) {
                this._timing.endRule(ruleId);
                messages.push({
                    ruleId,
                    severity: 2,
                    message: `Rule "${ruleId}" threw: ${err.message}`,
                    line: 1,
                    column: 0,
                    endLine: 1,
                    endColumn: 0
                });
                continue;
            }

            ruleTimings.push(ruleId);

            const registry = buildVisitorRegistry(visitor, ast);

            for (const reg of registry) {
                if (reg.isExit) {
                    if (reg.isComplex) {
                        combinedExitComplex.push(reg);
                    } else if (reg.simpleType) {
                        let arr = combinedExitSimple.get(reg.simpleType);

                        if (!arr) {
                            arr = [];
                            combinedExitSimple.set(reg.simpleType, arr);
                        }
                        arr.push(reg.fn);
                    }
                } else {
                    if (reg.isComplex) {
                        combinedEnterComplex.push(reg);
                    } else if (reg.simpleType) {
                        let arr = combinedEnterSimple.get(reg.simpleType);

                        if (!arr) {
                            arr = [];
                            combinedEnterSimple.set(reg.simpleType, arr);
                        }
                        arr.push(reg.fn);
                    }
                }
            }
        }

        // Single combined AST traversal dispatching to all rule listeners
        traverseAstCombined(
            ast,
            combinedEnterSimple,
            combinedExitSimple,
            combinedEnterComplex,
            combinedExitComplex
        );

        for (const rid of ruleTimings) {
            this._timing.endRule(rid);
        }

        const filtered = [];
        const suppressed = [];

        for (const msg of messages) {
            const rid = msg.ruleId;
            const line = msg.line;

            if (rid && isLineDisabled(line, rid, regions)) {
                suppressed.push(msg);
                continue;
            }
            if (!rid && isLineDisabled(line, null, regions)) {
                suppressed.push(msg);
                continue;
            }
            filtered.push(msg);
        }

        this._suppressedMessages = suppressed;

        filtered.sort((a, b) => {
            if (a.line !== b.line) {
                return a.line - b.line;
            }
            if (a.column !== b.column) {
                return a.column - b.column;
            }
            const ar = a.ruleId || "";
            const br = b.ruleId || "";

            return ar < br ? -1 : ar > br ? 1 : 0;
        });

        return filtered;
    }

    /**
     * @param {string} text
     * @param {object|object[]} config
     * @param {{ filename?: string, physicalFilename?: string }} [options]
     * @returns {{ fixed: boolean, messages: object[], output: string }}
     */
    verifyAndFix(text, config, options) {
        let current = String(text);
        let lastMessages = [];
        let fixed = false;
        let pass = 0;

        this._fixPassCount = 0;

        for (let i = 0; i < 10; i++) {
            pass = i + 1;
            const messages = this.verify(current, config, options);

            lastMessages = messages;

            const withFix = messages.filter(m => m.fix);

            if (withFix.length === 0) {
                break;
            }

            const result = applyFixes(current, messages);

            if (!result.fixed || result.output === current) {
                break;
            }

            fixed = true;
            current = result.output;
        }

        this._fixPassCount = pass;

        return {
            fixed,
            messages: lastMessages,
            output: current
        };
    }

    /**
     * @returns {SourceCode|null}
     */
    getSourceCode() {
        return this._lastSourceCode;
    }

    /**
     * @returns {Record<string, number>|null}
     */
    getTimes() {
        return this._timing ? this._timing.getData() : {};
    }

    /**
     * @returns {number}
     */
    getFixPassCount() {
        return this._fixPassCount;
    }

    /**
     * @returns {object[]}
     */
    getSuppressedMessages() {
        return this._suppressedMessages.slice();
    }
}

Linter.version = pkg.version;

module.exports = {
    Linter,
    SourceCode
};
