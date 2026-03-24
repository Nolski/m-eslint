"use strict";

const { analyzeScope } = require("./scope-analyze.js");

const RESTRICTED = new Set(["undefined", "NaN", "Infinity", "arguments", "eval"]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow shadowing restricted identifiers."
        },
        schema: [],
        messages: {
            shadow: "Do not shadow the restricted name `{{name}}`."
        }
    },
    create(context) {
        return {
            Program(node) {
                let scopeManager = null;

                try {
                    scopeManager = analyzeScope(node, context.languageOptions);
                } catch {
                    scopeManager = null;
                }
                if (!scopeManager) {
                    return;
                }
                for (const scope of scopeManager.scopes) {
                    if (scope === scopeManager.globalScope) {
                        continue;
                    }
                    for (const variable of scope.variables) {
                        if (!RESTRICTED.has(variable.name)) {
                            continue;
                        }
                        const def = variable.defs[0];

                        if (def && def.name) {
                            context.report({
                                node: def.name,
                                messageId: "shadow",
                                data: { name: variable.name }
                            });
                        }
                    }
                }
            }
        };
    }
};
