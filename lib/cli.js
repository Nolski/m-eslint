"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parse, generateHelp } = require("./options.js");
const { ESLint } = require("./eslint/eslint.js");
const { builtinRules } = require("./unsupported-api.js");
const pkg = require("../package.json");

/**
 * Returns true when a module specifier is a bare package name (resolved via
 * node_modules) rather than an absolute or relative file-system path.
 * @param {string} specifier
 * @returns {boolean}
 */
function isSafeModuleSpecifier(specifier) {
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
    const normalized = specifier.split(/[\\/]/u);
    if (normalized.some(seg => seg === "..")) {
        return false;
    }
    return true;
}

/**
 * @param {object} parsed
 * @returns {object}
 */
function buildOverrideConfig(parsed) {
    const rules = {};
    const languageOptions = {};
    const plugins = {};

    if (parsed.global && parsed.global.length) {
        const globals = {};

        for (const g of parsed.global) {
            const m = String(g).match(/^([^:]+)(?::(.+))?$/u);

            if (m) {
                const name = m[1];
                const mode = (m[2] || "readonly").toLowerCase();

                if (mode === "writable" || mode === "true") {
                    globals[name] = true;
                } else if (mode === "readonly" || mode === "false") {
                    globals[name] = false;
                } else {
                    globals[name] = mode;
                }
            }
        }
        languageOptions.globals = globals;
    }

    if (parsed.parser) {
        if (!isSafeModuleSpecifier(parsed.parser)) {
            throw new Error(
                `Invalid --parser value "${parsed.parser}": must be a package name resolvable from node_modules (path-based specifiers are not allowed).`
            );
        }
        languageOptions.parser = require(parsed.parser);
    }

    if (parsed.parserOptions) {
        try {
            languageOptions.parserOptions = JSON.parse(parsed.parserOptions);
        } catch (e) {
            throw new Error(`Invalid --parser-options JSON: ${e.message}`);
        }
    }

    if (parsed.plugin && parsed.plugin.length) {
        for (const plug of parsed.plugin) {
            if (!isSafeModuleSpecifier(plug)) {
                throw new Error(
                    `Invalid --plugin value "${plug}": must be a package name resolvable from node_modules (path-based specifiers are not allowed).`
                );
            }
            const mod = require(plug);
            const name =
                mod && mod.meta && mod.meta.name
                    ? mod.meta.name
                    : path.basename(plug).replace(/\.js$/u, "");

            plugins[name] = mod;
        }
    }

    if (parsed.rule && parsed.rule.length) {
        for (const spec of parsed.rule) {
            if (spec.startsWith("{")) {
                try {
                    const obj = JSON.parse(spec);
                    Object.assign(rules, obj);
                } catch {
                    // ignore parse error
                }
                continue;
            }
            const idx = spec.indexOf(":");

            if (idx === -1) {
                continue;
            }
            const ruleId = spec.slice(0, idx);
            const rest = spec.slice(idx + 1).trim();

            if (rest.startsWith("[")) {
                try {
                    rules[ruleId] = JSON.parse(rest);
                } catch {
                    rules[ruleId] = rest;
                }
            } else {
                rules[ruleId] = rest;
            }
        }
    }

    const out = {};

    if (Object.keys(rules).length) {
        out.rules = rules;
        const defs = {};

        for (const id of Object.keys(rules)) {
            if (builtinRules[id]) {
                defs[id] = builtinRules[id];
            }
        }
        if (Object.keys(defs).length) {
            out.ruleDefinitions = defs;
        }
    }
    if (Object.keys(languageOptions).length) {
        out.languageOptions = languageOptions;
    }
    if (Object.keys(plugins).length) {
        out.plugins = plugins;
    }

    return out;
}

/**
 * @param {object} parsed
 * @returns {object}
 */
function eslintOptionsFromParsed(parsed) {
    const opts = {
        cwd: process.cwd(),
        fix: Boolean(parsed.fix),
        cache: Boolean(parsed.cache),
        stats: Boolean(parsed.stats),
        passOnNoPatterns: Boolean(parsed.passOnNoPatterns),
        warnIgnored: parsed.ignore !== false
    };

    if (parsed.cacheLocation) {
        opts.cacheLocation = parsed.cacheLocation;
    }
    if (parsed.cacheStrategy) {
        opts.cacheStrategy = parsed.cacheStrategy;
    }
    if (parsed.noInlineConfig) {
        opts.allowInlineConfig = false;
    }
    if (parsed.noErrorOnUnmatchedPattern) {
        opts.errorOnUnmatchedPattern = false;
    }
    if (parsed.ignore === false) {
        opts.ignore = false;
    }
    if (parsed.ignorePattern && parsed.ignorePattern.length) {
        opts.ignorePatterns = parsed.ignorePattern;
    }
    if (parsed.flag && parsed.flag.length) {
        opts.flags = parsed.flag;
    }
    if (parsed.concurrency !== undefined && parsed.concurrency !== null) {
        const c = parsed.concurrency;

        if (c === "off" || c === "auto") {
            opts.concurrency = c;
        } else {
            const n = Number(c);

            opts.concurrency = Number.isFinite(n) ? n : "off";
        }
    }

    const override = buildOverrideConfig(parsed);

    if (Object.keys(override).length > 0) {
        opts.overrideConfig = override;
    }

    if (parsed.config) {
        opts.overrideConfigFile = path.resolve(process.cwd(), parsed.config);
    }
    if (parsed.noConfigLookup) {
        opts.overrideConfigFile = false;
    }

    return opts;
}

/**
 * @param {string[]} args
 * @param {string} [text]
 * @returns {Promise<number>}
 */
async function execute(args, text) {
    const argv =
        Array.isArray(args) &&
        args.length >= 2 &&
        (args[0] === process.execPath || /^node(?:\.exe)?$/iu.test(path.basename(args[0])))
            ? args.slice(2)
            : Array.isArray(args)
              ? args
              : [];

    let parsed;

    try {
        parsed = parse(argv);
    } catch (e) {
        console.error(e.message || String(e));
        return 2;
    }

    if (parsed.help) {
        console.log(generateHelp());
        return 0;
    }

    if (parsed.version) {
        console.log(pkg.version);
        return 0;
    }

    if (parsed.envInfo) {
        console.log(`Node: ${process.version}`);
        console.log(`Platform: ${process.platform} ${process.arch}`);
        console.log(`CWD: ${process.cwd()}`);
        return 0;
    }

    if (parsed.init) {
        console.log("Config initializer is not implemented in this build.");
        return 0;
    }

    const rest = parsed._ || [];

    if (parsed.printConfig) {
        const target = rest[0];

        if (!target) {
            console.error("Missing file path for --print-config.");
            return 2;
        }
        const eslint = new ESLint(eslintOptionsFromParsed(parsed));
        const cfg = await eslint.calculateConfigForFile(target);

        console.log(JSON.stringify(cfg, null, 2));
        return 0;
    }

    if (parsed.noColor) {
        process.env.NO_COLOR = "1";
        process.env.FORCE_COLOR = "0";
    }

    const eslint = new ESLint(eslintOptionsFromParsed(parsed));
    let results;

    try {
        if (parsed.stdin || text !== undefined) {
            const code = text !== undefined ? String(text) : await readStdin();

            results = await eslint.lintText(code, {
                filePath: parsed.stdinFilename || path.join(process.cwd(), "stdin.js")
            });
        } else {
            results = await eslint.lintFiles(rest);
        }
    } catch (e) {
        console.error(e.message || String(e));
        return 2;
    }

    if (parsed.fix && !parsed.fixDryRun) {
        await ESLint.outputFixes(results);
    }

    let outResults = results;

    if (parsed.quiet) {
        outResults = ESLint.getErrorResults(results);
    }

    const formatterName = parsed.format || "stylish";
    const formatter = await eslint.loadFormatter(formatterName);
    const rulesMeta = eslint.getRulesMetaForResults(outResults);
    const output = formatter.format(outResults, {
        cwd: process.cwd(),
        rulesMeta,
        fix: Boolean(parsed.fix)
    });

    if (parsed.outputFile) {
        const resolvedOutput = path.resolve(process.cwd(), parsed.outputFile);
        const resolvedCwd = path.resolve(process.cwd());

        if (!resolvedOutput.startsWith(resolvedCwd + path.sep) && resolvedOutput !== resolvedCwd) {
            console.error("Error: --output-file path must resolve within the current working directory.");
            return 2;
        }
        await fs.promises.writeFile(resolvedOutput, output, "utf8");
    } else {
        process.stdout.write(output);
        if (output.length && !output.endsWith("\n")) {
            process.stdout.write("\n");
        }
    }

    let errors = 0;
    let warnings = 0;

    for (const r of results) {
        errors += r.errorCount || 0;
        warnings += r.warningCount || 0;
    }

    let fatal = false;

    for (const r of results) {
        for (const m of r.messages || []) {
            if (m.fatal) {
                fatal = true;
            }
        }
    }

    if (fatal) {
        return 2;
    }

    const maxWarnings = parsed.maxWarnings;

    if (typeof maxWarnings === "number" && !Number.isNaN(maxWarnings) && warnings > maxWarnings) {
        return 1;
    }

    if (errors > 0) {
        return 1;
    }

    return 0;
}

/**
 * @returns {Promise<string>}
 */
function readStdin() {
    return new Promise((resolve, reject) => {
        const chunks = [];

        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => chunks.push(c));
        process.stdin.on("end", () => resolve(chunks.join("")));
        process.stdin.on("error", reject);
    });
}

module.exports = {
    execute
};
