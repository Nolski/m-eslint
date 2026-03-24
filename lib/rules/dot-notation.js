"use strict";

/**
 * @param {string} key
 * @returns {boolean}
 */
function isValidIdentifierName(key) {
    return /^[A-Za-z_$][\w$]*$/u.test(key);
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce dot notation when possible."
        },
        fixable: "code",
        schema: [],
        messages: {
            useDot: "'{{property}}' is better written in dot notation."
        }
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            MemberExpression(node) {
                if (!node.computed) {
                    return;
                }

                const prop = node.property;

                if (!prop || prop.type !== "Literal") {
                    return;
                }

                if (typeof prop.value !== "string") {
                    return;
                }

                const key = prop.value;

                if (!isValidIdentifierName(key)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "useDot",
                    data: { property: key },
                    fix(fixer) {
                        const objText = sourceCode.getText(node.object);

                        return fixer.replaceText(
                            node,
                            `${objText}.${key}`
                        );
                    }
                });
            }
        };
    }
};
