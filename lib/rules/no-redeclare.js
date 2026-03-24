"use strict";

const { analyze } = require("eslint-scope");

/**
 * @param {object} context
 * @param {object} ast
 */
function getScopeManager(context, ast) {
    const lo = context.languageOptions || {};
    let ecma = lo.ecmaVersion;

    if (ecma === "latest" || ecma == null) {
        ecma = 2024;
    }

    const st = lo.sourceType || "module";

    return analyze(ast, {
        ecmaVersion: typeof ecma === "number" ? ecma : 2024,
        sourceType: st === "commonjs" ? "script" : st,
        childVisitorKeys: context.sourceCode.visitorKeys || void 0
    });
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow variable redeclaration."
        },
        schema: [],
        messages: {
            redeclared: "'{{name}}' has already been declared."
        }
    },

    create(context) {
        const ast = context.sourceCode.ast;
        const scopeManager = getScopeManager(context, ast);

        return {
            Program() {
                for (const scope of scopeManager.scopes) {
                    for (const variable of scope.variables) {
                        if (variable.defs.length <= 1) {
                            continue;
                        }

                        for (let i = 1; i < variable.defs.length; i++) {
                            const def = variable.defs[i];

                            context.report({
                                node: def.name,
                                messageId: "redeclared",
                                data: { name: variable.name }
                            });
                        }
                    }
                }
            }
        };
    }
};
