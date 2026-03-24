"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require `var` declarations at the top of their scope."
        },
        schema: [],
        messages: {
            top: "`var` declarations should appear at the top of the function scope."
        }
    },
    create(context) {
        return {
            Program(node) {
                let seenNonVar = false;

                for (const st of node.body) {
                    if (st.type === "VariableDeclaration" && st.kind === "var") {
                        if (seenNonVar) {
                            context.report({ node: st, messageId: "top" });
                            return;
                        }
                    } else {
                        seenNonVar = true;
                    }
                }
            }
        };
    }
};
