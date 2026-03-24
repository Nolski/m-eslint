"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CONFIG_NAMES = [
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.cjs",
    "eslint.config.ts",
    "eslint.config.mts",
    "eslint.config.cts"
];

/** @type {Map<string, string|null>} */
const findCache = new Map();

/**
 * @param {string} dir
 * @returns {string|null}
 */
function findInDirectory(dir) {
    for (const name of CONFIG_NAMES) {
        const full = path.join(dir, name);

        try {
            if (fs.statSync(full).isFile()) {
                return full;
            }
        } catch {
            // missing or not readable
        }
    }
    return null;
}

const PROJECT_BOUNDARY_MARKERS = ["package.json", ".git"];

/**
 * @param {string} dir
 * @returns {boolean}
 */
function hasProjectBoundary(dir) {
    for (const marker of PROJECT_BOUNDARY_MARKERS) {
        const full = path.join(dir, marker);

        try {
            fs.statSync(full);
            return true;
        } catch {
            // missing or not readable
        }
    }
    return false;
}

/**
 * Search upward from `startDir` for `eslint.config.{js,mjs,cjs,ts,mts,cts}`.
 * Within each directory, priority is js → mjs → cjs → ts → mts → cts.
 * Stops traversal at the nearest project boundary (package.json or .git)
 * to prevent loading config files from shared ancestor directories.
 *
 * @param {string} startDir
 * @returns {string|null}
 */
function findConfigFile(startDir) {
    const resolvedStart = path.resolve(startDir);

    if (findCache.has(resolvedStart)) {
        return findCache.get(resolvedStart) ?? null;
    }

    let current = resolvedStart;

    for (;;) {
        const found = findInDirectory(current);

        if (found) {
            findCache.set(resolvedStart, found);
            return found;
        }

        if (hasProjectBoundary(current)) {
            break;
        }

        const parent = path.dirname(current);

        if (parent === current) {
            break;
        }
        current = parent;
    }

    findCache.set(resolvedStart, null);
    return null;
}

/**
 * @param {string} filePath
 * @returns {Promise<unknown>}
 */
async function loadConfigFile(filePath) {
    const ext = path.extname(filePath);

    if (ext === ".js" || ext === ".cjs") {
        return require(filePath);
    }

    if (ext === ".mjs") {
        const mod = await import(pathToFileURL(filePath).href);

        return mod.default !== undefined ? mod.default : mod;
    }

    if (ext === ".ts" || ext === ".mts" || ext === ".cts") {
        let createJiti;

        try {
            const jitiModule = require("jiti");

            createJiti = typeof jitiModule === "function" ? jitiModule : jitiModule.default;
        } catch {
            throw new Error(
                "Loading TypeScript ESLint config files requires the optional peer dependency \"jiti\"."
            );
        }

        if (typeof createJiti !== "function") {
            throw new Error("The \"jiti\" package did not export a factory function.");
        }

        const jiti = createJiti(__filename, { interopDefault: true });

        return jiti(filePath);
    }

    throw new Error(`Unsupported ESLint config extension for ${filePath}`);
}

module.exports = {
    findConfigFile,
    loadConfigFile
};
