"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce sorted `import` declarations."
        },
        schema: [],
        messages: {
            order: "Imports are not sorted alphabetically."
        }
    },
    create(context) {
        return {
            Program(node) {
                const imports = [];

                for (const st of node.body) {
                    if (st.type === "ImportDeclaration") {
                        imports.push(st);
                    }
                }
                for (let i = 1; i < imports.length; i += 1) {
                    const a = imports[i - 1].source.value;
                    const b = imports[i].source.value;

                    if (typeof a === "string" && typeof b === "string" && a > b) {
                        context.report({ node: imports[i], messageId: "order" });
                        return;
                    }
                }
            }
        };
    }
};
