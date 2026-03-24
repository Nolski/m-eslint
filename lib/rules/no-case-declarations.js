"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow lexical declarations in `case` clauses."
        },
        schema: [],
        messages: {
            caseDecl: "Declarations in case clauses create scope ambiguity."
        }
    },

    create(context) {
        return {
            SwitchCase(node) {
                const cons = node.consequent;

                if (!Array.isArray(cons)) {
                    return;
                }

                for (const stmt of cons) {
                    if (!stmt) {
                        continue;
                    }

                    if (
                        stmt.type === "VariableDeclaration" ||
                        stmt.type === "FunctionDeclaration" ||
                        stmt.type === "ClassDeclaration"
                    ) {
                        context.report({
                            node: stmt,
                            messageId: "caseDecl"
                        });
                    }
                }
            }
        };
    }
};
