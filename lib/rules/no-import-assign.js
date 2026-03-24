"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments to imported bindings."
        },
        schema: [],
        messages: {
            importReassign: "Assignment to import binding '{{name}}'."
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
                        const def = ref.resolved.defs.find(d => d.type === "ImportBinding");

                        if (!def) {
                            continue;
                        }

                        context.report({
                            node: ref.identifier,
                            messageId: "importReassign",
                            data: { name: ref.identifier.name }
                        });
                    }
                }
            }
        };
    }
};
