"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require guarding for-in loops with hasOwnProperty or similar."
        },
        schema: [],
        messages: {
            guardForIn: "The body of a for-in should be wrapped in an if statement."
        }
    },

    create(context) {
        return {
            ForInStatement(node) {
                const b = node.body;

                if (b.type === "BlockStatement" && b.body.length > 0 && b.body[0].type === "IfStatement") {
                    return;
                }

                context.report({ node: b, messageId: "guardForIn" });
            }
        };
    }
};
