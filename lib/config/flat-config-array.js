"use strict";

const path = require("node:path");
const { minimatch } = require("minimatch");
const { mergeConfigs, validateConfigObject } = require("./flat-config-schema.js");
const { getMatchingConfigIndices } = require("../native-binding.js");

const MINIMATCH_OPTIONS = { dot: true };

/**
 * @param {string} filePath
 * @returns {string}
 */
function normalizePathForGlob(filePath) {
    return filePath.split(path.sep).join("/");
}

/**
 * @param {string} pattern
 * @returns {string}
 */
function normalizeGlobPattern(pattern) {
    if (pattern.endsWith("/") && !pattern.endsWith("**")) {
        return `${pattern}**`;
    }
    return pattern;
}

/**
 * @param {string|string[]|undefined} patterns
 * @returns {string[]}
 */
function normalizePatternList(patterns) {
    if (patterns === undefined) {
        return [];
    }
    if (typeof patterns === "string") {
        return [normalizeGlobPattern(patterns)];
    }
    return patterns.map(normalizeGlobPattern);
}

/**
 * @param {object} config
 * @returns {boolean}
 */
function isGlobalIgnoresOnly(config) {
    if (Object.prototype.hasOwnProperty.call(config, "files")) {
        return false;
    }
    if (!Object.prototype.hasOwnProperty.call(config, "ignores")) {
        return false;
    }
    const keys = Object.keys(config).filter(k => k !== "name");

    return keys.length === 1 && keys[0] === "ignores";
}

/**
 * @param {string} filePath
 * @param {string|string[]|undefined} patterns
 * @returns {boolean}
 */
function pathMatchesAnyPattern(filePath, patterns) {
    const posixPath = normalizePathForGlob(filePath);

    for (const pattern of normalizePatternList(patterns)) {
        if (minimatch(posixPath, pattern, MINIMATCH_OPTIONS)) {
            return true;
        }
    }
    return false;
}

class FlatConfigArray {
    /**
     * @param {object[]} configs
     */
    constructor(configs) {
        if (!Array.isArray(configs)) {
            throw new TypeError("FlatConfigArray expects an array of config objects.");
        }
        this.configs = configs;
        this.normalized = false;

        // Pre-computed pattern arrays for Rust matching (Finding 6)
        this._filePatterns = null;
        this._ignorePatterns = null;
        this._isGlobalIgnores = null;
        this._configMergeCache = new Map();
    }

    /**
     * Pre-compile and cache pattern arrays for efficient Rust-based matching.
     */
    _ensurePatternArrays() {
        if (this._filePatterns !== null) {
            return;
        }

        const n = this.configs.length;

        this._filePatterns = new Array(n);
        this._ignorePatterns = new Array(n);
        this._isGlobalIgnores = new Array(n);

        for (let i = 0; i < n; i++) {
            const config = this.configs[i];
            const globalOnly = isGlobalIgnoresOnly(config);

            this._isGlobalIgnores[i] = globalOnly;
            this._filePatterns[i] = Object.prototype.hasOwnProperty.call(config, "files")
                ? normalizePatternList(config.files)
                : [];
            this._ignorePatterns[i] = Object.prototype.hasOwnProperty.call(config, "ignores")
                ? normalizePatternList(config.ignores)
                : [];
        }
    }

    /**
     * Validate every config object.
     * @returns {void}
     */
    normalizeSync() {
        for (let i = 0; i < this.configs.length; i++) {
            validateConfigObject(this.configs[i]);
        }
        this.normalized = true;
        this._ensurePatternArrays();
    }

    /**
     * @param {string} filePath
     * @returns {boolean}
     */
    isFileIgnored(filePath) {
        for (const config of this.configs) {
            if (!isGlobalIgnoresOnly(config)) {
                continue;
            }
            if (pathMatchesAnyPattern(filePath, config.ignores)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} filePath
     * @returns {object}
     */
    getConfigForFile(filePath) {
        this._ensurePatternArrays();

        const posixPath = normalizePathForGlob(filePath);

        // Use Rust-accelerated matching to find which configs apply
        const matchingIndices = getMatchingConfigIndices(
            posixPath,
            this._filePatterns,
            this._ignorePatterns,
            this._isGlobalIgnores
        );

        // If no config entry matched this file, it should not be linted.
        // Filter out global-ignore-only entries — they don't count as "matching".
        const nonIgnoreIndices = matchingIndices.filter(
            idx => !this._isGlobalIgnores[idx]
        );

        if (nonIgnoreIndices.length === 0) {
            return undefined;
        }

        // Cache merged results keyed by the set of matching config indices
        const cacheKey = matchingIndices.join(",");
        const cached = this._configMergeCache.get(cacheKey);

        if (cached !== undefined) {
            return cached;
        }

        let merged = Object.create(null);

        for (const idx of matchingIndices) {
            merged = mergeConfigs(merged, this.configs[idx]);
        }

        this._configMergeCache.set(cacheKey, merged);
        return merged;
    }
}

module.exports = { FlatConfigArray };
