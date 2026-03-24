"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow unnecessary semicolons."
        },
        fixable: "code",
        deprecated: DEPRECATED,
        schema: [],
        messages: {
            extraSemi: "Unnecessary semicolon."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            EmptyStatement(node) {
                const p = node.parent;

                if (
                    p &&
                    (p.type === "WhileStatement" ||
                        p.type === "ForStatement" ||
                        p.type === "ForInStatement" ||
                        p.type === "ForOfStatement")
                ) {
                    return;
                }

                if (p && p.type === "LabeledStatement" && p.body === node) {
                    return;
                }

                if (p && p.type === "IfStatement" && p.alternate === node) {
                    return;
                }

                const semi = sourceCode.getFirstToken(node);

                if (!semi || semi.value !== ";") {
                    return;
                }

                context.report({
                    node,
                    loc: semi.loc,
                    messageId: "extraSemi",
                    fix(fixer) {
                        return fixer.remove(semi);
                    }
                });
            }
        };
    }
};
