"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

/**
 * @param {object} node
 * @returns {boolean}
 */
function isVarInForHeader(node) {
    const p = node.parent;

    if (!p) {
        return false;
    }
    if (p.type === "ForStatement" && p.init === node) {
        return true;
    }
    if (p.type === "ForInStatement" && p.left === node) {
        return true;
    }
    if (p.type === "ForOfStatement" && p.left === node) {
        return true;
    }
    return false;
}

/**
 * @param {object} node
 * @returns {boolean}
 */
function statementNeedsSemicolon(node) {
    const t = node.type;

    if (t === "ExpressionStatement") {
        return true;
    }
    if (t === "VariableDeclaration" && !isVarInForHeader(node)) {
        return true;
    }
    if (
        t === "DebuggerStatement" ||
        t === "ThrowStatement" ||
        t === "ReturnStatement" ||
        t === "BreakStatement" ||
        t === "ContinueStatement"
    ) {
        return true;
    }
    if (t === "ImportDeclaration" || t === "ExportAllDeclaration") {
        return true;
    }
    if (t === "ExportNamedDeclaration" && node.declaration) {
        return true;
    }
    if (t === "ExportDefaultDeclaration") {
        const d = node.declaration;

        if (!d) {
            return false;
        }
        if (d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") {
            return false;
        }
        if (d.type === "FunctionExpression" || d.type === "ArrowFunctionExpression") {
            return false;
        }
        return true;
    }
    return false;
}

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Require or disallow semicolons."
        },
        fixable: "code",
        deprecated: DEPRECATED,
        schema: [
            {
                enum: ["always", "never"]
            }
        ],
        messages: {
            missingSemi: "Missing semicolon.",
            extraSemi: "Extra semicolon."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const mode = context.options[0] === "never" ? "never" : "always";

        /**
         * @param {object} node
         */
        function check(node) {
            if (!statementNeedsSemicolon(node)) {
                return;
            }

            const last = sourceCode.getLastToken(node);

            if (!last) {
                return;
            }

            const hasSemi = last.type === "Punctuator" && last.value === ";";

            if (mode === "always" && !hasSemi) {
                context.report({
                    node,
                    messageId: "missingSemi",
                    fix(fixer) {
                        return fixer.insertTextAfter(last, ";");
                    }
                });
            } else if (mode === "never" && hasSemi) {
                context.report({
                    node,
                    messageId: "extraSemi",
                    loc: last.loc,
                    fix(fixer) {
                        return fixer.remove(last);
                    }
                });
            }
        }

        return {
            ExpressionStatement: check,
            VariableDeclaration: check,
            DebuggerStatement: check,
            ThrowStatement: check,
            ReturnStatement: check,
            BreakStatement: check,
            ContinueStatement: check,
            ImportDeclaration: check,
            ExportAllDeclaration: check,
            ExportNamedDeclaration: check,
            ExportDefaultDeclaration: check
        };
    }
};
