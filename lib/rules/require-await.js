"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow async functions that do not contain `await`."
        },
        schema: [],
        messages: {
            missing: "Async function has no `await` expression."
        }
    },
    create(context) {
        return {
            "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
                if (!node.async || node.body.type !== "BlockStatement") {
                    return;
                }
                let hasAwait = false;

                /**
                 * @param {object} n
                 */
                function walk(n) {
                    if (!n) {
                        return;
                    }
                    if (n.type === "AwaitExpression") {
                        hasAwait = true;
                        return;
                    }
                    for (const key of Object.keys(n)) {
                        if (key === "parent") {
                            continue;
                        }
                        const v = n[key];

                        if (Array.isArray(v)) {
                            for (const c of v) {
                                walk(c);
                            }
                        } else if (v && typeof v === "object") {
                            walk(v);
                        }
                    }
                }

                walk(node.body);
                if (!hasAwait) {
                    context.report({ node, messageId: "missing" });
                }
            }
        };
    }
};
