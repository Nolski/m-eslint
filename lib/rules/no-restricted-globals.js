"use strict";

const { analyzeScope } = require("./scope-analyze.js");

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow specified global identifiers."
        },
        schema: [
            {
                type: "array",
                items: { type: "string" },
                uniqueItems: true
            }
        ],
        messages: {
            restricted: "Global `{{name}}` is restricted."
        }
    },
    create(context) {
        const denied = new Set((context.options[0] || []).filter((x) => typeof x === "string"));

        if (denied.size === 0) {
            return {};
        }

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
                const globalScope = scopeManager.globalScope;

                if (!globalScope) {
                    return;
                }
                for (const variable of globalScope.variables) {
                    if (!denied.has(variable.name)) {
                        continue;
                    }
                    for (const ref of variable.references) {
                        if (!ref.isRead()) {
                            continue;
                        }
                        context.report({
                            node: ref.identifier,
                            messageId: "restricted",
                            data: { name: variable.name }
                        });
                    }
                }
            }
        };
    }
};
