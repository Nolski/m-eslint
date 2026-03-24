"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow control flow statements in finally blocks."
        },
        schema: [],
        messages: {
            unsafeFinally: "Control flow statement in 'finally' block."
        }
    },

    create(context) {
        return {
            TryStatement(node) {
                if (!node.finalizer || node.finalizer.type !== "BlockStatement") {
                    return;
                }

                /**
                 * @param {object} st
                 */
                function checkStatement(st) {
                    if (
                        st.type === "ReturnStatement" ||
                        st.type === "ThrowStatement" ||
                        st.type === "BreakStatement" ||
                        st.type === "ContinueStatement"
                    ) {
                        context.report({ node: st, messageId: "unsafeFinally" });
                    }
                }

                for (const st of node.finalizer.body) {
                    checkStatement(st);
                }
            }
        };
    }
};
