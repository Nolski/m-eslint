"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow labels that share a name with a variable."
        },
        schema: [],
        messages: {
            clash: "Label `{{name}}` conflicts with a variable in the same block."
        }
    },
    create(context) {
        return {
            LabeledStatement(node) {
                const name = node.label.name;
                let parent = node.parent;

                while (parent) {
                    if (parent.type === "BlockStatement") {
                        for (const st of parent.body) {
                            if (st.type !== "VariableDeclaration") {
                                continue;
                            }
                            for (const d of st.declarations) {
                                if (d.id.type === "Identifier" && d.id.name === name) {
                                    context.report({
                                        node: node.label,
                                        messageId: "clash",
                                        data: { name }
                                    });
                                    return;
                                }
                            }
                        }
                        break;
                    }
                    parent = parent.parent;
                }
            }
        };
    }
};
