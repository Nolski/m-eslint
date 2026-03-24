"use strict";

const { analyzeScope } = require("./scope-analyze.js");

/**
 * @param {object} def
 */
function isConstDefinition(def) {
    return def.kind === "const";
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments to variables declared with const."
        },
        schema: [],
        messages: {
            constReassign: "Assignment to constant variable '{{name}}'."
        }
    },
    create(context) {
        return {
            "Program:exit"(node) {
                const scopeManager = analyzeScope(node, context.languageOptions);

                for (const scope of scopeManager.scopes) {
                    for (const ref of scope.references) {
                        if (!ref.isWrite() || !ref.resolved || ref.init) {
                            continue;
                        }
                        const variable = ref.resolved;

                        if (!variable.defs.some(isConstDefinition)) {
                            continue;
                        }

                        context.report({
                            node: ref.identifier,
                            messageId: "constReassign",
                            data: { name: ref.identifier.name }
                        });
                    }
                }
            }
        };
    }
};
