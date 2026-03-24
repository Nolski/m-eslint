"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow assignments that create global bindings accidentally."
        },
        schema: [],
        messages: {
            implicit: "Unexpected global binding `{{name}}`."
        }
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode();

        let scopeManager = null;

        try {
            scopeManager = analyzeScope(sourceCode.ast, context.languageOptions);
        } catch {
            scopeManager = null;
        }

        return {
            Program() {
                if (!scopeManager) {
                    return;
                }
                const globalScope = scopeManager.globalScope;

                if (!globalScope) {
                    return;
                }
                for (const variable of globalScope.variables) {
                    if (variable.name === "arguments") {
                        continue;
                    }
                    for (const def of variable.defs) {
                        if (def.type === "ImplicitGlobalVariable") {
                            context.report({
                                node: def.node,
                                messageId: "implicit",
                                data: { name: variable.name }
                            });
                        }
                    }
                }
            }
        };
    }
};
