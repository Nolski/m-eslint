"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow returning values from Promise executor functions."
        },
        schema: [],
        messages: {
            noReturnValue: "Promise executor functions must not return a value."
        }
    },
    create(context) {
        return {
            NewExpression(node) {
                if (
                    !node.callee ||
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "Promise" ||
                    !node.arguments[0]
                ) {
                    return;
                }

                const fn = node.arguments[0];

                if (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression") {
                    return;
                }

                if (fn.body.type !== "BlockStatement") {
                    if (fn.type === "ArrowFunctionExpression") {
                        context.report({ node: fn.body, messageId: "noReturnValue" });
                    }
                    return;
                }

                for (const st of fn.body.body) {
                    if (st.type === "ReturnStatement" && st.argument) {
                        context.report({ node: st, messageId: "noReturnValue" });
                    }
                }
            }
        };
    }
};
