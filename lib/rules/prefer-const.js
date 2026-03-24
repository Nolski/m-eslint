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
 * @param {import("eslint-scope").Variable} variable
 * @returns {boolean}
 */
function isNeverReassigned(variable) {
    let hasInit = false;

    for (const ref of variable.references) {
        if (!ref.isWrite()) {
            continue;
        }

        if (ref.init) {
            hasInit = true;
            continue;
        }

        return false;
    }

    return hasInit;
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer `const` when a binding is never reassigned."
        },
        fixable: "code",
        schema: [],
        messages: {
            preferConst: "'{{name}}' is never reassigned. Use 'const' instead."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const ast = sourceCode.ast;
        const scopeManager = getScopeManager(context, ast);

        return {
            VariableDeclaration(node) {
                if (node.kind !== "let") {
                    return;
                }

                for (const d of node.declarations) {
                    if (d.id.type !== "Identifier" || !d.init) {
                        return;
                    }
                }

                // Find the enclosing scope that contains this variable,
                // rather than trying to acquire a scope from the declaration itself.
                let scope = scopeManager.acquire(node.parent);

                if (!scope) {
                    // Walk up to find the nearest scope-creating ancestor.
                    scope = scopeManager.acquire(ast);
                }

                if (!scope) {
                    return;
                }

                // Search through all child scopes as well to find the variable.
                function findVariable(name, startScope) {
                    const v = startScope.set.get(name);

                    if (v) {
                        return v;
                    }

                    for (const child of startScope.childScopes) {
                        const found = findVariable(name, child);

                        if (found) {
                            return found;
                        }
                    }

                    return null;
                }

                for (const d of node.declarations) {
                    const name = d.id.name;
                    const variable = findVariable(name, scope);

                    if (!variable || !isNeverReassigned(variable)) {
                        return;
                    }
                }

                const firstName =
                    node.declarations[0].type === "VariableDeclarator" &&
                    node.declarations[0].id.type === "Identifier"
                        ? node.declarations[0].id.name
                        : "";
                const letToken = sourceCode.getFirstToken(node);

                if (!letToken || letToken.value !== "let") {
                    return;
                }

                context.report({
                    node,
                    messageId: "preferConst",
                    data: { name: firstName },
                    fix(fixer) {
                        return fixer.replaceText(letToken, "const");
                    }
                });
            }
        };
    }
};
