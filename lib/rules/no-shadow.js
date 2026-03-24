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

/**
 * @param {import("eslint-scope").Scope} scope
 * @param {string} name
 * @returns {boolean}
 */
function isDeclaredInOuterScopes(scope, name) {
    let outer = scope.upper;

    while (outer) {
        if (outer.set.has(name)) {
            return true;
        }
        outer = outer.upper;
    }

    return false;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow shadowing variables from outer scopes."
        },
        schema: [],
        messages: {
            shadow: "'{{name}}' is already declared in the outer scope."
        }
    },

    create(context) {
        const ast = context.sourceCode.ast;
        const scopeManager = getScopeManager(context, ast);

        return {
            Program() {
                for (const scope of scopeManager.scopes) {
                    if (scope.type === "global") {
                        continue;
                    }

                    for (const variable of scope.variables) {
                        if (!isDeclaredInOuterScopes(scope, variable.name)) {
                            continue;
                        }

                        const def = variable.defs[0];

                        if (!def || !def.name) {
                            continue;
                        }

                        context.report({
                            node: def.name,
                            messageId: "shadow",
                            data: { name: variable.name }
                        });
                    }
                }
            }
        };
    }
};
