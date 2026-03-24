"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Require yield in generator functions."
        },
        schema: [],
        messages: {
            missingYield: "Generator function should contain a 'yield' keyword."
        }
    },

    create(context) {
        /**
         * @param {object} body
         * @returns {boolean}
         */
        function hasYield(body) {
            if (!body) {
                return false;
            }

            const stack = [body];

            while (stack.length) {
                const node = stack.pop();

                if (!node || typeof node !== "object") {
                    continue;
                }

                if (node.type === "YieldExpression") {
                    return true;
                }

                for (const key of Object.keys(node)) {
                    if (key === "parent") {
                        continue;
                    }
                    const v = node[key];

                    if (Array.isArray(v)) {
                        for (const x of v) {
                            stack.push(x);
                        }
                    } else if (v && typeof v === "object" && typeof v.type === "string") {
                        stack.push(v);
                    }
                }
            }

            return false;
        }

        return {
            FunctionDeclaration(node) {
                if (!node.generator || !node.body) {
                    return;
                }

                if (!hasYield(node.body)) {
                    context.report({ node, messageId: "missingYield" });
                }
            },
            FunctionExpression(node) {
                if (!node.generator || !node.body) {
                    return;
                }

                if (!hasYield(node.body)) {
                    context.report({ node, messageId: "missingYield" });
                }
            }
        };
    }
};
