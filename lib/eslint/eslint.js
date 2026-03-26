"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { glob } = require("glob");
const pkg = require("../../package.json");
const { Linter } = require("../linter/linter.js");
const { FlatConfigArray } = require("../config/flat-config-array.js");
const { findConfigFile: resolveConfigFilePath, loadConfigFile } = require("../config/config-loader.js");
const { defaultConfig } = require("../config/default-config.js");

/**
 * Returns true when a specifier is a bare package name (resolved via
 * node_modules) rather than an absolute or relative file-system path.
 * @param {string} specifier
 * @returns {boolean}
 */
function isSafeFormatterSpecifier(specifier) {
    if (typeof specifier !== "string" || !specifier.trim()) {
        return false;
    }
    if (path.isAbsolute(specifier)) {
        return false;
    }
    if (
        specifier === "." ||
        specifier === ".." ||
        specifier.startsWith("./") ||
        specifier.startsWith("../") ||
        specifier.startsWith(".\\") ||
        specifier.startsWith("..\\")
    ) {
        return false;
    }
    const segments = specifier.split(/[\\/]/u);
    if (segments.some(seg => seg === "..")) {
        return false;
    }
    return true;
}

/**
 * @param {unknown} value
 * @returns {object[]}
 */
function normalizeConfigEntries(value) {
    if (value === null || value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === "object") {
        return [value];
    }
    return [];
}

/**
 * Flat merged config uses `plugins` as an object map; the Linter resolves rules via
 * `ruleDefinitions` and plugin arrays. Expand plugin rules into `ruleDefinitions`.
 *
 * @param {object} merged
 * @returns {object}
 */
function normalizeMergedConfigForLinter(merged) {
    const out = {
        rules: merged.rules ? { ...merged.rules } : {},
        ruleDefinitions: { ...(merged.ruleDefinitions || {}) },
        languageOptions: merged.languageOptions ? { ...merged.languageOptions } : {},
        settings: merged.settings ? { ...merged.settings } : {},
        plugins: [],
        parser: merged.parser || null
    };

    if (merged.plugins && typeof merged.plugins === "object" && !Array.isArray(merged.plugins)) {
        for (const [namespace, plugin] of Object.entries(merged.plugins)) {
            if (plugin && typeof plugin === "object") {
                out.plugins.push(plugin);
            }
            if (plugin && plugin.rules && typeof plugin.rules === "object") {
                for (const shortName of Object.keys(plugin.rules)) {
                    const ruleId = `${namespace}/${shortName}`;

                    out.ruleDefinitions[ruleId] = plugin.rules[shortName];
                }
            }
        }
    } else if (Array.isArray(merged.plugins)) {
        out.plugins = merged.plugins.slice();
    }

    return out;
}

/**
 * @param {string} ruleId
 * @param {object} merged
 * @returns {object|null}
 */
function resolveRuleModuleForMeta(ruleId, merged) {
    if (merged.ruleDefinitions && merged.ruleDefinitions[ruleId]) {
        return merged.ruleDefinitions[ruleId];
    }
    if (merged.plugins && typeof merged.plugins === "object" && !Array.isArray(merged.plugins)) {
        const slash = ruleId.indexOf("/");

        if (slash > 0) {
            const ns = ruleId.slice(0, slash);
            const short = ruleId.slice(slash + 1);
            const plugin = merged.plugins[ns];

            if (plugin && plugin.rules && plugin.rules[short]) {
                return plugin.rules[short];
            }
        }
    }
    if (Array.isArray(merged.plugins)) {
        for (const plugin of merged.plugins) {
            if (plugin && plugin.rules && plugin.rules[ruleId]) {
                return plugin.rules[ruleId];
            }
        }
    }
    return null;
}

/**
 * @param {object[]} messages
 * @param {function(object): boolean} ruleFilter
 * @returns {object[]}
 */
function applyRuleFilter(messages, ruleFilter) {
    if (typeof ruleFilter !== "function") {
        return messages;
    }
    return messages.filter(m => ruleFilter(m));
}

/**
 * @param {object[]} messages
 * @returns {{ errorCount: number, warningCount: number, fixableErrorCount: number, fixableWarningCount: number }}
 */
function countMessages(messages) {
    let errorCount = 0;
    let warningCount = 0;
    let fixableErrorCount = 0;
    let fixableWarningCount = 0;

    for (const m of messages) {
        const sev = m.fatal ? 2 : m.severity;

        if (sev === 2) {
            errorCount++;
            if (m.fix) {
                fixableErrorCount++;
            }
        } else if (sev === 1) {
            warningCount++;
            if (m.fix) {
                fixableWarningCount++;
            }
        }
    }

    return { errorCount, warningCount, fixableErrorCount, fixableWarningCount };
}

/**
 * @param {string} filePath
 * @param {"metadata"|"content"} strategy
 * @returns {Promise<string>}
 */
async function fingerprintFile(filePath, strategy) {
    const stat = await fs.promises.stat(filePath);

    if (strategy === "metadata") {
        return `m:${stat.size}:${stat.mtimeMs}`;
    }
    const buf = await fs.promises.readFile(filePath);

    return `c:${crypto.createHash("md5").update(buf).digest("hex")}`;
}

/**
 * @param {string} cachePath
 * @returns {Promise<object>}
 */
async function readLintCache(cachePath) {
    try {
        const raw = await fs.promises.readFile(cachePath, "utf8");

        return JSON.parse(raw);
    } catch {
        return { v: 1, files: {} };
    }
}

/**
 * @param {string} cachePath
 * @param {object} data
 * @returns {Promise<void>}
 */
async function writeLintCache(cachePath, data) {
    await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.promises.writeFile(cachePath, JSON.stringify(data), "utf8");
}

class ESLint {
    /**
     * @param {object} [options]
     */
    constructor(options = {}) {
        this.allowInlineConfig = options.allowInlineConfig !== false;
        this.baseConfig = options.baseConfig != null ? options.baseConfig : null;
        this.cache = Boolean(options.cache);
        this.cacheLocation = options.cacheLocation != null ? options.cacheLocation : ".eslintcache";
        this.cacheStrategy = options.cacheStrategy === "content" ? "content" : "metadata";
        this.concurrency = options.concurrency != null ? options.concurrency : "off";
        this.cwd = options.cwd != null ? path.resolve(options.cwd) : process.cwd();
        this.errorOnUnmatchedPattern = options.errorOnUnmatchedPattern !== false;
        this.fix = options.fix != null ? options.fix : false;
        this.fixTypes = options.fixTypes != null ? options.fixTypes : null;
        this.flags = Array.isArray(options.flags) ? options.flags.slice() : [];
        this.globInputPaths = options.globInputPaths !== false;
        this.ignore = options.ignore !== false;
        this.ignorePatterns = options.ignorePatterns != null ? options.ignorePatterns : null;
        this.overrideConfig = options.overrideConfig != null ? options.overrideConfig : null;
        this.overrideConfigFile =
            options.overrideConfigFile !== undefined ? options.overrideConfigFile : null;
        this.passOnNoPatterns = Boolean(options.passOnNoPatterns);
        this.plugins = options.plugins && typeof options.plugins === "object" ? options.plugins : {};
        this.ruleFilter = typeof options.ruleFilter === "function" ? options.ruleFilter : () => true;
        this.stats = Boolean(options.stats);
        this.warnIgnored = options.warnIgnored !== false;

        /** @type {FlatConfigArray|null} */
        this._flatConfigArray = null;
        /** @type {Promise<FlatConfigArray>|null} */
        this._configPromise = null;
        /** @type {Map<string, object>|null} */
        this._lintCacheData = null;
    }

    /**
     * @returns {Set<string>}
     */
    _flagSet() {
        const s = new Set();

        for (const f of this.flags) {
            s.add(f);
        }
        if (!this.allowInlineConfig) {
            s.add("no-inline-config");
        }
        return s;
    }

    /**
     * @returns {Promise<FlatConfigArray>}
     */
    async _ensureConfigArray() {
        if (this._flatConfigArray) {
            return this._flatConfigArray;
        }
        if (!this._configPromise) {
            this._configPromise = this._loadFlatConfigArray();
        }
        this._flatConfigArray = await this._configPromise;

        return this._flatConfigArray;
    }

    /**
     * @returns {Promise<FlatConfigArray>}
     */
    async _loadFlatConfigArray() {
        const parts = [];

        parts.push(...defaultConfig);
        parts.push(...normalizeConfigEntries(this.baseConfig));

        let configFilePath = null;

        if (this.overrideConfigFile === false) {
            configFilePath = null;
        } else if (typeof this.overrideConfigFile === "string") {
            configFilePath = path.resolve(this.cwd, this.overrideConfigFile);
        } else {
            configFilePath = resolveConfigFilePath(this.cwd);
        }

        if (configFilePath) {
            const loaded = await loadConfigFile(configFilePath);

            parts.push(...normalizeConfigEntries(loaded));
        }

        if (this.ignore && this.ignorePatterns && this.ignorePatterns.length > 0) {
            parts.push(globalIgnoresEntry(this.ignorePatterns));
        }

        parts.push(...normalizeConfigEntries(this.overrideConfig));

        if (this.plugins && Object.keys(this.plugins).length > 0) {
            parts.push({ plugins: { ...this.plugins } });
        }

        const arr = new FlatConfigArray(parts, { basePath: this.cwd });

        arr.normalizeSync();

        return arr;
    }

    /**
     * @param {string} flag
     * @returns {boolean}
     */
    hasFlag(flag) {
        return this.flags.includes(flag);
    }

    /**
     * @param {string} filePath
     * @returns {Promise<object>}
     */
    async calculateConfigForFile(filePath) {
        const abs = path.resolve(this.cwd, filePath);
        const arr = await this._ensureConfigArray();

        return arr.getConfigForFile(abs);
    }

    /**
     * @param {string} [filePath]
     * @returns {Promise<string|null>}
     */
    async findConfigFile(filePath) {
        if (typeof this.overrideConfigFile === "string") {
            return path.resolve(this.cwd, this.overrideConfigFile);
        }
        if (this.overrideConfigFile === false) {
            return null;
        }
        const start = filePath ? path.dirname(path.resolve(this.cwd, filePath)) : this.cwd;

        return resolveConfigFilePath(start);
    }

    /**
     * @param {string} filePath
     * @returns {Promise<boolean>}
     */
    async isPathIgnored(filePath) {
        const abs = path.resolve(this.cwd, filePath);
        const arr = await this._ensureConfigArray();

        return arr.isFileIgnored(abs);
    }

    /**
     * @param {object[]} results
     * @returns {Record<string, object>}
     */
    getRulesMetaForResults(results) {
        const arr = this._flatConfigArray;

        if (!arr) {
            return Object.create(null);
        }

        const meta = Object.create(null);

        for (const result of results) {
            const abs = path.resolve(this.cwd, result.filePath || "");
            const merged = arr.getConfigForFile(abs);
            const normalized = normalizeMergedConfigForLinter(merged);

            for (const m of result.messages || []) {
                if (!m.ruleId || meta[m.ruleId]) {
                    continue;
                }
                const mod = resolveRuleModuleForMeta(m.ruleId, normalized);

                if (mod && mod.meta) {
                    meta[m.ruleId] = mod.meta;
                } else {
                    meta[m.ruleId] = {};
                }
            }
        }

        return meta;
    }

    /**
     * @param {string} [name]
     * @returns {Promise<{ format: Function }>}
     */
    async loadFormatter(name) {
        const formatterName = name && String(name).trim() ? String(name).trim() : "stylish";
        const builtins = path.join(__dirname, "../cli-engine/formatters");
        const builtinPath = path.join(builtins, `${formatterName}.js`);

        try {
            return require(builtinPath);
        } catch {
            if (!isSafeFormatterSpecifier(formatterName)) {
                throw new Error(
                    `Formatter "${formatterName}" not found. ` +
                    "Custom formatters must be installed as npm packages (path-based specifiers are not allowed)."
                );
            }
            return require(formatterName);
        }
    }

    /**
     * @param {string} code
     * @param {{ filePath?: string, warnIgnored?: boolean }} [options]
     * @returns {Promise<object[]>}
     */
    async lintText(code, options = {}) {
        const filePathOpt = options.filePath;
        const filePath = filePathOpt
            ? path.resolve(this.cwd, filePathOpt)
            : path.join(this.cwd, "__eslint_input__.js");
        const arr = await this._ensureConfigArray();

        if (this.ignore && arr.isFileIgnored(filePath)) {
            if (options.warnIgnored !== false && this.warnIgnored) {
                return [
                    {
                        filePath,
                        messages: [
                            {
                                severity: 1,
                                message: "File ignored because of a matching ignore pattern.",
                                ruleId: null
                            }
                        ],
                        errorCount: 0,
                        warningCount: 1,
                        fixableErrorCount: 0,
                        fixableWarningCount: 0,
                        output: String(code),
                        suppressedMessages: []
                    }
                ];
            }
            return [
                {
                    filePath,
                    messages: [],
                    errorCount: 0,
                    warningCount: 0,
                    fixableErrorCount: 0,
                    fixableWarningCount: 0,
                    output: String(code),
                    suppressedMessages: []
                }
            ];
        }

        const merged = arr.getConfigForFile(filePath);
        const linterConfig = normalizeMergedConfigForLinter(merged);
        const linter = new Linter({
            cwd: this.cwd,
            flags: this._flagSet()
        });

        const text = String(code);
        let messages;
        let output = text;

        const shouldFix = Boolean(this.fix);

        if (shouldFix) {
            const r = linter.verifyAndFix(text, linterConfig, {
                filename: filePath,
                physicalFilename: filePath
            });

            messages = r.messages;
            output = r.output;
        } else {
            messages = linter.verify(text, linterConfig, {
                filename: filePath,
                physicalFilename: filePath
            });
        }

        messages = applyRuleFilter(messages, this.ruleFilter);
        const counts = countMessages(messages);
        const result = {
            filePath,
            messages,
            ...counts,
            output: shouldFix ? output : void 0,
            suppressedMessages: linter.getSuppressedMessages()
        };

        if (this.stats) {
            result.stats = { times: linter.getTimes() };
        }

        return [result];
    }

    /**
     * @param {string[]} patterns
     * @returns {Promise<object[]>}
     */
    async lintFiles(patterns) {
        const arr = await this._ensureConfigArray();
        const list = Array.isArray(patterns) ? patterns : [];

        if (list.length === 0) {
            if (this.passOnNoPatterns) {
                return [];
            }
            if (this.errorOnUnmatchedPattern) {
                throw new Error("No files matching the pattern were found.");
            }
            return [];
        }

        let files = [];

        if (this.globInputPaths) {
            for (const raw of list) {
                let pat = raw;

                // Expand directory patterns to globs
                const resolvedPat = path.resolve(this.cwd, pat);
                try {
                    const stat = fs.statSync(resolvedPat);
                    if (stat.isDirectory()) {
                        pat = pat.endsWith('/') || pat.endsWith(path.sep) ? `${pat}**/*` : `${pat}/**/*`;
                    }
                } catch (_) {
                    // Not a real path, treat as glob pattern
                    if (pat.endsWith('/') || pat.endsWith(path.sep)) {
                        pat = `${pat}**/*`;
                    }
                }

                const matches = await glob(pat, {
                    cwd: this.cwd,
                    absolute: true,
                    nodir: true,
                    ignore: ["**/node_modules/**"]
                });

                files.push(...matches);
            }
        } else {
            files = list.map(p => path.resolve(this.cwd, p));
        }

        files = [...new Set(files)].sort();

        // Filter out files that don't match any config's `files` patterns.
        // getConfigForFile() returns undefined for non-matching files.
        files = files.filter(f => {
            if (arr.isFileIgnored(f)) return false;
            const config = arr.getConfigForFile(f);
            return config !== undefined;
        });

        if (files.length === 0 && this.errorOnUnmatchedPattern) {
            throw new Error("No files matching the pattern were found.");
        }

        const cacheFileAbs = path.resolve(this.cwd, this.cacheLocation);
        let cacheData = null;

        if (this.cache) {
            cacheData = await readLintCache(cacheFileAbs);
            this._lintCacheData = cacheData;
        }

        const useParallel = this._concurrencyLimit() > 1;
        const tasks = files.map(filePath => () =>
            this._lintOneFile(filePath, arr, cacheData, cacheFileAbs)
        );

        let results;

        if (useParallel) {
            results = await runPool(tasks, this._concurrencyLimit());
        } else {
            results = [];
            for (const t of tasks) {
                results.push(await t());
            }
        }

        if (this.cache && cacheData) {
            await writeLintCache(cacheFileAbs, cacheData);
        }

        return results;
    }

    /**
     * @returns {number}
     */
    _concurrencyLimit() {
        if (this.concurrency === "off" || this.concurrency === 0) {
            return 1;
        }
        if (this.concurrency === "auto") {
            const os = require("node:os");

            return Math.max(1, os.cpus().length);
        }
        const n = Number(this.concurrency);

        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    }

    /**
     * @param {string} filePath
     * @param {FlatConfigArray} arr
     * @param {object|null} cacheData
     * @param {string} cacheFileAbs
     * @returns {Promise<object>}
     */
    async _lintOneFile(filePath, arr, cacheData, cacheFileAbs) {
        const abs = path.resolve(filePath);

        if (this.ignore && arr.isFileIgnored(abs)) {
            if (this.warnIgnored) {
                return {
                    filePath: abs,
                    messages: [
                        {
                            severity: 1,
                            message: "File ignored because of a matching ignore pattern.",
                            ruleId: null
                        }
                    ],
                    errorCount: 0,
                    warningCount: 1,
                    fixableErrorCount: 0,
                    fixableWarningCount: 0,
                    suppressedMessages: []
                };
            }
            return {
                filePath: abs,
                messages: [],
                errorCount: 0,
                warningCount: 0,
                fixableErrorCount: 0,
                fixableWarningCount: 0,
                suppressedMessages: []
            };
        }

        let text;

        if (this.cache && cacheData && cacheData.files && cacheData.files[abs]) {
            const fp = await fingerprintFile(abs, this.cacheStrategy);
            const entry = cacheData.files[abs];

            if (entry && entry.fp === fp && entry.result) {
                return entry.result;
            }
        }

        try {
            text = await fs.promises.readFile(abs, "utf8");
        } catch (err) {
            return {
                filePath: abs,
                messages: [
                    {
                        fatal: true,
                        severity: 2,
                        message: err.message,
                        ruleId: null,
                        line: 0,
                        column: 0
                    }
                ],
                errorCount: 1,
                warningCount: 0,
                fixableErrorCount: 0,
                fixableWarningCount: 0,
                suppressedMessages: []
            };
        }

        const merged = arr.getConfigForFile(abs);
        const linterConfig = normalizeMergedConfigForLinter(merged);
        const linter = new Linter({
            cwd: this.cwd,
            flags: this._flagSet()
        });

        const shouldFix = Boolean(this.fix);
        let messages;
        let output = text;

        if (shouldFix) {
            const r = linter.verifyAndFix(text, linterConfig, {
                filename: abs,
                physicalFilename: abs
            });

            messages = r.messages;
            output = r.output;
        } else {
            messages = linter.verify(text, linterConfig, {
                filename: abs,
                physicalFilename: abs
            });
        }

        messages = applyRuleFilter(messages, this.ruleFilter);
        const counts = countMessages(messages);
        const result = {
            filePath: abs,
            messages,
            ...counts,
            output: shouldFix ? output : void 0,
            suppressedMessages: linter.getSuppressedMessages()
        };

        if (this.stats) {
            result.stats = { times: linter.getTimes() };
        }

        if (this.cache && cacheData) {
            const fp = await fingerprintFile(abs, this.cacheStrategy);

            if (!cacheData.files) {
                cacheData.files = {};
            }
            cacheData.files[abs] = { fp, result };
        }

        return result;
    }

    /**
     * @param {object[]} results
     * @returns {Promise<void>}
     */
    static async outputFixes(results) {
        const cwd = process.cwd();

        for (const r of results) {
            if (r && r.output != null && r.filePath) {
                const resolved = path.resolve(r.filePath);

                if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
                    continue;
                }
                await fs.promises.writeFile(resolved, r.output, "utf8");
            }
        }
    }

    /**
     * @param {object[]} results
     * @returns {object[]}
     */
    static getErrorResults(results) {
        return results
            .map(r => {
                const errMsgs = (r.messages || []).filter(m => m.severity === 2 || m.fatal);

                return {
                    ...r,
                    messages: errMsgs,
                    errorCount: errMsgs.length,
                    warningCount: 0,
                    fixableErrorCount: errMsgs.filter(m => m.fix).length,
                    fixableWarningCount: 0
                };
            })
            .filter(r => r.messages.length > 0);
    }

    /**
     * @param {string} moduleUrl
     * @returns {Promise<ESLint>}
     */
    static async fromOptionsModule(moduleUrl) {
        if (typeof moduleUrl !== "string") {
            throw new Error("moduleUrl must be a string.");
        }
        if (!moduleUrl.startsWith("file://")) {
            throw new Error(
                "moduleUrl must use the file:// protocol."
            );
        }
        if (moduleUrl.includes("..")) {
            throw new Error(
                "moduleUrl must not contain path traversal sequences."
            );
        }
        const cwd = process.cwd();
        const { fileURLToPath } = require("node:url");
        const resolved = fileURLToPath(moduleUrl);

        if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
            throw new Error(
                "moduleUrl must resolve to a file within the current working directory."
            );
        }
        const mod = await import(moduleUrl);
        const opts = mod.default !== undefined ? mod.default : mod;

        return new ESLint(opts);
    }
}

ESLint.version = pkg.version;
ESLint.configType = "flat";
ESLint.defaultConfig = defaultConfig;

/**
 * @param {string[]} patterns
 * @returns {{ ignores: string[] }}
 */
function globalIgnoresEntry(patterns) {
    return { ignores: patterns.slice() };
}

/**
 * @param {Array<() => Promise<object>>} tasks
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function runPool(tasks, limit) {
    const results = new Array(tasks.length);
    let idx = 0;

    async function worker() {
        for (;;) {
            const current = idx++;

            if (current >= tasks.length) {
                return;
            }
            results[current] = await tasks[current]();
        }
    }

    const workers = [];

    for (let i = 0; i < limit; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);

    return results;
}

module.exports = {
    ESLint
};
