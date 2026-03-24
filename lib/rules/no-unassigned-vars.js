"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow variables that are never assigned a value."
        },
        schema: [],
        messages: {
            unassigned: "Variable `{{name}}` is never assigned."
        }
    },
    create(context) {
        return {
            Program(node) {
                let scopeManager = null;

                try {
                    scopeManager = analyzeScope(node, context.languageOptions);
                } catch {
                    scopeManager = null;
                }
                if (!scopeManager) {
                    return;
                }
                for (const scope of scopeManager.scopes) {
                    for (const variable of scope.variables) {
                        let assigned = false;

                        for (const def of variable.defs) {
                            if (def.type === "Variable" && def.parent && def.parent.init) {
                                assigned = true;
                            }
                            if (def.type === "Parameter") {
                                assigned = true;
                            }
                        }
                        for (const ref of variable.references) {
                            if (ref.isWrite()) {
                                assigned = true;
                            }
                        }
                        if (!assigned) {
                            const def = variable.defs[0];

                            if (def && def.name) {
                                context.report({
                                    node: def.name,
                                    messageId: "unassigned",
                                    data: { name: variable.name }
                                });
                            }
                        }
                    }
                }
            }
        };
    }
};
