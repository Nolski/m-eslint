"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow var bindings that leak outside their block."
        },
        schema: [],
        messages: {
            useLet: "Unexpected `var` in a block scope; use `let` or `const`."
        }
    },
    create(context) {
        return {
            VariableDeclaration(node) {
                if (node.kind !== "var") {
                    return;
                }
                let parent = node.parent;

                while (parent) {
                    if (parent.type === "BlockStatement" && parent.parent && parent.parent.type !== "Program") {
                        context.report({ node, messageId: "useLet" });
                        return;
                    }
                    parent = parent.parent;
                }
            }
        };
    }
};
