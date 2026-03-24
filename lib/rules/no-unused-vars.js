"use strict";

const { analyzeScope } = require("./scope-analyze.js");

/**
 * @param {unknown} raw
 */
function normalizeOptions(raw) {
    const defaults = {
        vars: "all",
        args: "after-used",
        caughtErrors: "none",
        argsIgnorePattern: null,
        varsIgnorePattern: null,
        caughtErrorsIgnorePattern: null,
        ignoreRestSiblings: false
    };

    if (raw === "all" || raw === "local") {
        return { ...defaults, vars: raw };
    }
    if (raw && typeof raw === "object") {
        return { ...defaults, ...raw };
    }

    return defaults;
}

/**
 * @param {string|null} pattern
 * @param {string} name
 */
function matchesPattern(pattern, name) {
    if (!pattern) {
        return false;
    }
    try {
        const re = new RegExp(pattern, "u");

        return re.test(name);
    } catch {
        return false;
    }
}

/**
 * @param {object} variable
 */
function variableIsUsed(variable) {
    for (const ref of variable.references) {
        if (ref.isRead()) {
            return true;
        }
    }

    return false;
}

/**
 * @param {object} variable
 */
function isRestSiblingIgnored(variable, ignoreRestSiblings) {
    if (!ignoreRestSiblings || !variable.defs.length) {
        return false;
    }
    const def = variable.defs[0];

    if (def.type !== "Variable") {
        return false;
    }
    let node = def.name;

    while (node && node.parent) {
        const p = node.parent;

        if (p.type === "RestElement" && p.parent && p.parent.type === "ObjectPattern") {
            return true;
        }
        node = p;
    }

    return false;
}

/**
 * @param {object} scope
 * @returns {object[]}
 */
function getOrderedParamVariables(scope) {
    const block = scope.block;

    if (
        !block ||
        (block.type !== "FunctionDeclaration" &&
            block.type !== "FunctionExpression" &&
            block.type !== "ArrowFunctionExpression")
    ) {
        return [];
    }

    const out = [];

    for (const param of block.params) {
        const collectFirst = (p) => {
            if (!p) {
                return null;
            }
            if (p.type === "Identifier") {
                return p.name;
            }
            if (p.type === "AssignmentPattern") {
                return collectFirst(p.left);
            }
            if (p.type === "RestElement") {
                return collectFirst(p.argument);
            }

            return null;
        };

        const topName = collectFirst(param);

        if (topName && scope.set && typeof scope.set.get === "function") {
            const v = scope.set.get(topName);

            if (v) {
                out.push(v);
            }
        }
    }

    return out;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow variables that are declared but never read."
        },
        schema: [
            {
                oneOf: [
                    { enum: ["all", "local"] },
                    {
                        type: "object",
                        properties: {
                            vars: { enum: ["all", "local"] },
                            args: { enum: ["after-used", "all", "none"] },
                            argsIgnorePattern: { type: "string" },
                            varsIgnorePattern: { type: "string" },
                            caughtErrors: { enum: ["all", "none"] },
                            caughtErrorsIgnorePattern: { type: "string" },
                            ignoreRestSiblings: { type: "boolean" }
                        }
                    }
                ]
            }
        ],
        messages: {
            unusedVar: "'{{varName}}' is defined but not used."
        }
    },
    create(context) {
        const opts = normalizeOptions(context.options);

        return {
            "Program:exit"(node) {
                const scopeManager = analyzeScope(node, context.languageOptions);

                for (const scope of scopeManager.scopes) {
                    for (const variable of scope.variables) {
                        const name = variable.name;

                        if (name === "arguments") {
                            continue;
                        }

                        if (matchesPattern(opts.varsIgnorePattern, name)) {
                            continue;
                        }

                        if (opts.vars === "local" && scope.type === "global") {
                            continue;
                        }

                        if (isRestSiblingIgnored(variable, opts.ignoreRestSiblings)) {
                            continue;
                        }

                        const isParameter = variable.defs.some(d => d.type === "Parameter");
                        const isCatch = variable.defs.some(d => d.type === "CatchClause");

                        if (isCatch) {
                            if (opts.caughtErrors === "none") {
                                continue;
                            }
                            if (matchesPattern(opts.caughtErrorsIgnorePattern, name)) {
                                continue;
                            }
                            if (!variableIsUsed(variable)) {
                                context.report({
                                    node: variable.identifiers[0] || variable.defs[0].name,
                                    messageId: "unusedVar",
                                    data: { varName: name }
                                });
                            }
                            continue;
                        }

                        if (isParameter) {
                            if (opts.args === "none") {
                                continue;
                            }
                            if (matchesPattern(opts.argsIgnorePattern, name)) {
                                continue;
                            }

                            if (variableIsUsed(variable)) {
                                continue;
                            }

                            if (opts.args === "after-used") {
                                const ordered = getOrderedParamVariables(variable.scope);
                                let lastUsedIndex = -1;

                                for (let i = 0; i < ordered.length; i++) {
                                    if (variableIsUsed(ordered[i])) {
                                        lastUsedIndex = i;
                                    }
                                }
                                const idx = ordered.indexOf(variable);

                                if (idx === -1 || idx <= lastUsedIndex) {
                                    continue;
                                }
                            }

                            context.report({
                                node: variable.identifiers[0] || variable.defs[0].name,
                                messageId: "unusedVar",
                                data: { varName: name }
                            });
                            continue;
                        }

                        if (variableIsUsed(variable)) {
                            continue;
                        }

                        context.report({
                            node: variable.identifiers[0] || variable.defs[0].name,
                            messageId: "unusedVar",
                            data: { varName: name }
                        });
                    }
                }
            }
        };
    }
};
