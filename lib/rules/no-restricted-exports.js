"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow specified named exports."
        },
        schema: [
            {
                type: "array",
                items: { type: "string" },
                uniqueItems: true
            }
        ],
        messages: {
            restricted: "Export `{{name}}` is restricted."
        }
    },
    create(context) {
        const denied = new Set((context.options[0] || []).filter((x) => typeof x === "string"));

        if (denied.size === 0) {
            return {};
        }

        return {
            ExportNamedDeclaration(node) {
                for (const spec of node.specifiers) {
                    if (spec.type !== "ExportSpecifier") {
                        continue;
                    }
                    const name =
                        spec.exported.type === "Identifier" ? spec.exported.name : String(spec.exported.value);

                    if (denied.has(name)) {
                        context.report({ node: spec, messageId: "restricted", data: { name } });
                    }
                }
            }
        };
    }
};
