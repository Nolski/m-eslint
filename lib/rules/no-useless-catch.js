"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `catch` blocks that only rethrow."
        },
        schema: [],
        messages: {
            uselessCatch: "Unnecessary catch clause that only rethrows the error."
        }
    },

    create(context) {
        return {
            CatchClause(node) {
                const body = node.body;

                if (!body || body.type !== "BlockStatement") {
                    return;
                }

                if (body.body.length !== 1) {
                    return;
                }

                const only = body.body[0];

                if (!only || only.type !== "ThrowStatement") {
                    return;
                }

                const arg = only.argument;

                if (!arg || arg.type !== "Identifier") {
                    return;
                }

                const param = node.param;

                if (
                    param &&
                    param.type === "Identifier" &&
                    param.name === arg.name
                ) {
                    context.report({
                        node,
                        messageId: "uselessCatch"
                    });
                }
            }
        };
    }
};
