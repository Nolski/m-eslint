"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow invalid regular expression literals and RegExp calls."
        },
        schema: [],
        messages: {
            invalid: "This regular expression is invalid: {{detail}}"
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.regex === "object" && node.regex) {
                    try {
                        RegExp(node.regex.pattern, node.regex.flags || "");
                    } catch (e) {
                        const detail = e instanceof Error ? e.message : String(e);

                        context.report({
                            node,
                            messageId: "invalid",
                            data: { detail }
                        });
                    }
                }
            },
            NewExpression(node) {
                if (
                    !node.callee ||
                    node.callee.type !== "Identifier" ||
                    node.callee.name !== "RegExp" ||
                    !node.arguments[0] ||
                    node.arguments[0].type !== "Literal" ||
                    typeof node.arguments[0].value !== "string"
                ) {
                    return;
                }

                const pattern = node.arguments[0].value;
                const flags =
                    node.arguments[1] &&
                    node.arguments[1].type === "Literal" &&
                    typeof node.arguments[1].value === "string"
                        ? node.arguments[1].value
                        : "";

                try {
                    RegExp(pattern, flags);
                } catch (e) {
                    const detail = e instanceof Error ? e.message : String(e);

                    context.report({
                        node,
                        messageId: "invalid",
                        data: { detail }
                    });
                }
            }
        };
    }
};
