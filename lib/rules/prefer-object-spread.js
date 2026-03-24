"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer object spread over Object.assign."
        },
        fixable: "code",
        schema: [],
        messages: {
            preferSpread: "Use an object spread instead of Object.assign."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            CallExpression(node) {
                const c = node.callee;

                if (
                    !c ||
                    c.type !== "MemberExpression" ||
                    c.computed ||
                    c.object.type !== "Identifier" ||
                    c.object.name !== "Object" ||
                    c.property.type !== "Identifier" ||
                    c.property.name !== "assign"
                ) {
                    return;
                }

                if (node.arguments.length === 0) {
                    return;
                }

                const spreads = node.arguments.map((a) => `...${sourceCode.getText(a)}`).join(", ");

                context.report({
                    node,
                    messageId: "preferSpread",
                    fix(fixer) {
                        return fixer.replaceText(node, `{ ${spreads} }`);
                    }
                });
            }
        };
    }
};
