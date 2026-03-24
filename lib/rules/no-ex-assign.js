"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow assignments to catch clause parameters."
        },
        schema: [],
        messages: {
            exAssign: "Do not reassign caught exception '{{name}}'."
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
                        const def = ref.resolved.defs.find(d => d.type === "CatchClause");

                        if (!def) {
                            continue;
                        }

                        context.report({
                            node: ref.identifier,
                            messageId: "exAssign",
                            data: { name: ref.identifier.name }
                        });
                    }
                }
            }
        };
    }
};
