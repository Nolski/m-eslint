"use strict";

const path = require("node:path");

let nativeModule = null;

function getPlatformNodeFile() {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === "linux" && arch === "x64") {
        return "eslint-native.linux-x64-gnu.node";
    }
    if (platform === "linux" && arch === "arm64") {
        return "eslint-native.linux-arm64-gnu.node";
    }
    if (platform === "darwin" && arch === "x64") {
        return "eslint-native.darwin-x64.node";
    }
    if (platform === "darwin" && arch === "arm64") {
        return "eslint-native.darwin-arm64.node";
    }
    return null;
}

function loadNative() {
    if (nativeModule !== null) {
        return nativeModule;
    }

    const nodeFile = getPlatformNodeFile();

    if (!nodeFile) {
        nativeModule = false;
        return nativeModule;
    }

    try {
        nativeModule = require(path.join(__dirname, "..", "native", nodeFile));
    } catch (_e) {
        nativeModule = false;
    }
    return nativeModule;
}

// --- Pure JS fallbacks ---

function computeLineDepthsJS(text) {
    const len = text.length;
    const depths = [0];
    let depth = 0;

    for (let i = 0; i < len; i++) {
        const c = text.charCodeAt(i);

        if (c === 123 /* { */ || c === 91 /* [ */ || c === 40 /* ( */) {
            depth++;
        } else if (c === 125 /* } */ || c === 93 /* ] */ || c === 41 /* ) */) {
            if (depth > 0) {
                depth--;
            }
        } else if (c === 10 /* \n */) {
            depths.push(depth);
        } else if (c === 13 /* \r */) {
            if (i + 1 < len && text.charCodeAt(i + 1) === 10) {
                i++;
            }
            depths.push(depth);
        }
    }
    return depths;
}

function globMatchPatternJS(filePath, pattern) {
    const { minimatch } = require("minimatch");

    return minimatch(filePath, pattern, { dot: true });
}

function batchGlobMatchJS(filePath, patterns) {
    const { minimatch } = require("minimatch");

    return patterns.map(p => minimatch(filePath, p, { dot: true }));
}

function getMatchingConfigIndicesJS(filePath, configFilePatterns, configIgnorePatterns, isGlobalIgnores) {
    const { minimatch } = require("minimatch");
    const opts = { dot: true };
    const result = [];

    for (let i = 0; i < configFilePatterns.length; i++) {
        if (isGlobalIgnores[i]) {
            continue;
        }

        const files = configFilePatterns[i];

        if (files.length > 0) {
            let anyMatch = false;

            for (const p of files) {
                if (minimatch(filePath, p, opts)) {
                    anyMatch = true;
                    break;
                }
            }
            if (!anyMatch) {
                continue;
            }
        }

        const ignores = configIgnorePatterns[i];
        let anyIgnore = false;

        if (ignores.length > 0) {
            for (const p of ignores) {
                if (minimatch(filePath, p, opts)) {
                    anyIgnore = true;
                    break;
                }
            }
        }

        if (!anyIgnore) {
            result.push(i);
        }
    }

    return result;
}

// --- Exported API: prefer native, fallback to JS ---

function computeLineDepths(text) {
    const native = loadNative();

    if (native) {
        return native.computeLineDepths(text);
    }
    return computeLineDepthsJS(text);
}

function globMatchPattern(filePath, pattern) {
    const native = loadNative();

    if (native) {
        return native.globMatchPattern(filePath, pattern);
    }
    return globMatchPatternJS(filePath, pattern);
}

function batchGlobMatch(filePath, patterns) {
    const native = loadNative();

    if (native) {
        return native.batchGlobMatch(filePath, patterns);
    }
    return batchGlobMatchJS(filePath, patterns);
}

function getMatchingConfigIndices(filePath, configFilePatterns, configIgnorePatterns, isGlobalIgnores) {
    const native = loadNative();

    if (native) {
        return native.getMatchingConfigIndices(filePath, configFilePatterns, configIgnorePatterns, isGlobalIgnores);
    }
    return getMatchingConfigIndicesJS(filePath, configFilePatterns, configIgnorePatterns, isGlobalIgnores);
}

module.exports = {
    computeLineDepths,
    globMatchPattern,
    batchGlobMatch,
    getMatchingConfigIndices
};
