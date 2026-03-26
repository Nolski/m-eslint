"use strict";

/**
 * Minimal placeholder for the built-in `@` plugin namespace. Concrete rule
 * implementations are registered elsewhere in the linter.
 */
const builtinAtPlugin = {
    meta: {
        name: "@eslint/builtin-at",
        namespace: "@"
    },
    rules: Object.create(null)
};

/**
 * Default file patterns for JavaScript files.
 * Only these file types are linted by default.
 */
const DEFAULT_JS_FILES = ["**/*.js", "**/*.mjs", "**/*.cjs"];

/**
 * Default flat config entries applied when no user config is present.
 *
 * @type {object[]}
 */
const defaultConfig = [
    {
        name: "eslint/default/builtin-at-plugin",
        files: DEFAULT_JS_FILES,
        plugins: {
            "@": builtinAtPlugin
        }
    },
    {
        name: "eslint/default/language-javascript",
        files: DEFAULT_JS_FILES,
        language: "javascript",
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {}
        }
    },
    {
        name: "eslint/default/global-ignores",
        ignores: ["**/node_modules/", ".git/"]
    },
    {
        name: "eslint/default/ecmascript-modules",
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    },
    {
        name: "eslint/default/commonjs",
        files: ["**/*.cjs"],
        languageOptions: {
            sourceType: "commonjs"
        }
    }
];

module.exports = {
    defaultConfig,
    builtinAtPlugin
};
