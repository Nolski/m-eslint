"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow this and super before super() in constructors."
        },
        schema: [],
        messages: {
            thisBeforeSuper: "'{{keyword}}' used before super() call."
        }
    },

    create(context) {
        return {
            MethodDefinition(node) {
                if (node.kind !== "constructor" || !node.value || node.value.type !== "FunctionExpression") {
                    return;
                }

                const body = node.value.body;

                if (!body || body.type !== "BlockStatement") {
                    return;
                }

                let firstSuper = null;

                for (const st of body.body) {
                    if (
                        st.type === "ExpressionStatement" &&
                        st.expression.type === "CallExpression" &&
                        st.expression.callee.type === "Super"
                    ) {
                        firstSuper = st.expression;
                        break;
                    }
                }

                if (!firstSuper || !Array.isArray(firstSuper.range)) {
                    return;
                }

                const limit = firstSuper.range[0];

                /**
                 * @param {object} sub
                 */
                function walk(sub) {
                    if (!sub || typeof sub !== "object" || !Array.isArray(sub.range)) {
                        return;
                    }

                    if (sub.range[0] >= limit) {
                        return;
                    }

                    if (sub.type === "ThisExpression") {
                        context.report({
                            node: sub,
                            messageId: "thisBeforeSuper",
                            data: { keyword: "this" }
                        });
                    } else if (sub.type === "Super") {
                        const p = sub.parent;

                        if (p && p === firstSuper && p.type === "CallExpression" && p.callee === sub) {
                            /* allowed super() */
                        } else {
                            context.report({
                                node: sub,
                                messageId: "thisBeforeSuper",
                                data: { keyword: "super" }
                            });
                        }
                    }

                    for (const key of Object.keys(sub)) {
                        if (key === "parent") {
                            continue;
                        }
                        const v = sub[key];

                        if (Array.isArray(v)) {
                            for (const x of v) {
                                walk(x);
                            }
                        } else if (v && typeof v === "object" && typeof v.type === "string") {
                            walk(v);
                        }
                    }
                }

                walk(body);
            }
        };
    }
};
