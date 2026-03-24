"use strict";

/**
 * @param {string} pattern
 * @param {string} flags
 * @returns {void}
 */
function checkPattern(context, node, pattern, flags) {
    let groupCount = 0;

    for (let i = 0; i < pattern.length; i += 1) {
        const ch = pattern[i];

        if (ch === "\\") {
            i += 1;
            continue;
        }
        if (ch === "(" && pattern[i + 1] !== "?") {
            groupCount += 1;
        }
    }

    const backref = /\\([1-9]\d*)/gu;
    let m;

    while ((m = backref.exec(pattern)) !== null) {
        const num = Number.parseInt(m[1], 10);

        if (num > groupCount) {
            context.report({
                node,
                messageId: "invalidBackref",
                data: { num: String(num) }
            });
            return;
        }
    }
    void flags;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow useless regular-expression backreferences."
        },
        schema: [],
        messages: {
            invalidBackref: "Backreference \\{{num}} does not refer to a capturing group in this pattern."
        }
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.regex === "object" && node.regex) {
                    checkPattern(context, node, node.regex.pattern, node.regex.flags || "");
                }
            },
            NewExpression(node) {
                if (
                    node.callee &&
                    node.callee.type === "Identifier" &&
                    node.callee.name === "RegExp" &&
                    node.arguments[0] &&
                    node.arguments[0].type === "Literal" &&
                    typeof node.arguments[0].value === "string"
                ) {
                    const flags =
                        node.arguments[1] &&
                        node.arguments[1].type === "Literal" &&
                        typeof node.arguments[1].value === "string"
                            ? node.arguments[1].value
                            : "";

                    checkPattern(context, node, node.arguments[0].value, flags);
                }
            }
        };
    }
};
