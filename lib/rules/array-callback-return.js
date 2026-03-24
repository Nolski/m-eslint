"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce return statements in array method callbacks."
        },
        schema: [],
        messages: {
            expected: "Expected a return value from this array callback."
        }
    },
    create(context) {
        const methods = new Set(["map", "filter", "every", "some", "find", "findIndex"]);

        return {
            CallExpression(node) {
                if (
                    node.callee.type !== "MemberExpression" ||
                    node.callee.property.type !== "Identifier" ||
                    !methods.has(node.callee.property.name) ||
                    !node.arguments[0]
                ) {
                    return;
                }
                const fn = node.arguments[0];

                if (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression") {
                    return;
                }
                if (fn.body.type !== "BlockStatement") {
                    return;
                }
                let hasReturn = false;

                for (const st of fn.body.body) {
                    if (st.type === "ReturnStatement") {
                        hasReturn = true;
                        break;
                    }
                }
                if (!hasReturn && fn.body.body.length > 0) {
                    context.report({ node: fn, messageId: "expected" });
                }
            }
        };
    }
};
