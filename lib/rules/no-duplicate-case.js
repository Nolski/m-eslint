"use strict";

/**
 * @param {object} node
 * @param {object} context
 */
function testSource(node, context) {
    if (!node) {
        return "default";
    }

    return context.sourceCode.getText(node);
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow duplicate case labels in switch statements."
        },
        schema: [],
        messages: {
            duplicateCase: "Duplicate case label."
        }
    },
    create(context) {
        return {
            SwitchStatement(node) {
                const seen = new Map();

                for (const sc of node.cases) {
                    const key = testSource(sc.test, context);

                    if (seen.has(key)) {
                        context.report({ node: sc, messageId: "duplicateCase" });
                    } else {
                        seen.set(key, sc);
                    }
                }
            }
        };
    }
};
