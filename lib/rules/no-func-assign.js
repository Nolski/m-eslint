"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow reassigning identifiers created by function declarations."
        },
        schema: [],
        messages: {
            funcReassign: "Function '{{name}}' was reassigned."
        }
    },
    create(context) {
        return {
            "Program:exit"(node) {
                const scopeManager = analyzeScope(node, context.languageOptions);

                for (const scope of scopeManager.scopes) {
                    for (const ref of scope.references) {
                        if (!ref.isWrite() || ref.init || !ref.resolved) {
                            continue;
                        }
                        const def = ref.resolved.defs.find(d => d.type === "FunctionName");

                        if (!def) {
                            continue;
                        }

                        context.report({
                            node: ref.identifier,
                            messageId: "funcReassign",
                            data: { name: ref.identifier.name }
                        });
                    }
                }
            }
        };
    }
};
