"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow duplicate conditions in if-else-if chains."
        },
        schema: [],
        messages: {
            dupeElseIf: "This branch duplicates a condition from an earlier branch."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            IfStatement(node) {
                if (node.parent && node.parent.type === "IfStatement" && node.parent.alternate === node) {
                    return;
                }

                /** @type {Set<string>} */
                const tests = new Set();
                let current = node;

                while (current && current.type === "IfStatement") {
                    const key = sourceCode.getText(current.test);

                    if (tests.has(key)) {
                        context.report({
                            node: current.test,
                            messageId: "dupeElseIf"
                        });
                    }
                    tests.add(key);
                    current = current.alternate && current.alternate.type === "IfStatement" ? current.alternate : null;
                }
            }
        };
    }
};
