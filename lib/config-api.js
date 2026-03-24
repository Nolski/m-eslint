"use strict";

let defineConfig;
let globalIgnores;

try {
    const helpers = require("@eslint/config-helpers");

    defineConfig = function defineConfig(...args) {
        return helpers.defineConfig(...args);
    };
    globalIgnores = function globalIgnores(...patterns) {
        return helpers.globalIgnores(patterns);
    };
} catch {
    /**
     * @param {unknown} item
     * @returns {void}
     */
    function processConfigArg(item, out) {
        if (item === null || item === undefined) {
            return;
        }
        if (typeof item === "function") {
            processConfigArg(item(), out);
            return;
        }
        if (Array.isArray(item)) {
            for (const el of item) {
                processConfigArg(el, out);
            }
            return;
        }
        if (typeof item === "object") {
            out.push(item);
            return;
        }
        throw new TypeError(`defineConfig expected an object or array, got ${typeof item}.`);
    }

    /**
     * @param {...unknown} configs
     * @returns {object[]}
     */
    defineConfig = function defineConfigLocal(...configs) {
        if (configs.length === 0) {
            throw new TypeError("defineConfig expects at least one argument.");
        }
        const out = [];

        for (const c of configs) {
            processConfigArg(c, out);
        }
        return out;
    };

    /**
     * @param {string[]} patterns
     * @returns {{ ignores: string[] }}
     */
    globalIgnores = function globalIgnoresLocal(...patterns) {
        return { ignores: [...patterns] };
    };
}

module.exports = {
    defineConfig,
    globalIgnores
};
