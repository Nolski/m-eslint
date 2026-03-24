"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require consistent return behavior in functions."
        },
        schema: [],
        messages: {
            mixed: "This function mixes value returns with bare returns."
        }
    },
    create(context) {
        return {
            "FunctionExpression, ArrowFunctionExpression"(node) {
                if (node.body.type !== "BlockStatement") {
                    return;
                }
                let hasValue = false;
                let hasBare = false;

                for (const st of node.body.body) {
                    if (st.type === "ReturnStatement") {
                        if (st.argument) {
                            hasValue = true;
                        } else {
                            hasBare = true;
                        }
                    }
                }
                if (hasValue && hasBare) {
                    context.report({ node, messageId: "mixed" });
                }
            }
        };
    }
};
