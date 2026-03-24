"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unnecessary nested blocks."
        },
        schema: [],
        messages: {
            lone: "Block does not introduce a new lexical scope and is unnecessary."
        }
    },
    create(context) {
        return {
            BlockStatement(node) {
                if (!node.parent || node.parent.type !== "BlockStatement") {
                    return;
                }
                let hasLexical = false;

                for (const st of node.body) {
                    if (st.type === "VariableDeclaration" && (st.kind === "let" || st.kind === "const")) {
                        hasLexical = true;
                        break;
                    }
                }
                if (!hasLexical) {
                    context.report({ node, messageId: "lone" });
                }
            }
        };
    }
};
