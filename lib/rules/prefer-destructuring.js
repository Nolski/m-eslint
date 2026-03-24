"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer destructuring assignment."
        },
        fixable: "code",
        schema: [],
        messages: {
            preferDestructuring: "Use destructuring assignment."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            VariableDeclarator(node) {
                if (
                    !node.init ||
                    node.init.type !== "MemberExpression" ||
                    node.id.type !== "Identifier"
                ) {
                    return;
                }

                const me = node.init;

                if (me.computed || me.property.type !== "Identifier") {
                    return;
                }

                if (node.id.name !== me.property.name) {
                    return;
                }

                const obj = me.object;

                context.report({
                    node,
                    messageId: "preferDestructuring",
                    fix(fixer) {
                        return fixer.replaceText(
                            node,
                            `{ ${me.property.name} } = ${sourceCode.getText(obj)}`
                        );
                    }
                });
            }
        };
    }
};
