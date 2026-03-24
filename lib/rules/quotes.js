"use strict";

const DEPRECATED = { message: "Formatting rules are deprecated. Use a dedicated formatter." };

/**
 * @param {string} s
 * @returns {string}
 */
function escapeSingle(s) {
    return s.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'").replace(/\r/gu, "\\r").replace(/\n/gu, "\\n");
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeBacktick(s) {
    return s.replace(/\\/gu, "\\\\").replace(/`/gu, "\\`").replace(/\$\{/gu, "\\${");
}

module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce consistent quote style for strings."
        },
        fixable: "code",
        deprecated: DEPRECATED,
        schema: [
            {
                enum: ["double", "single", "backtick"]
            }
        ],
        messages: {
            wrongQuotes: "Strings should use {{expected}} quotes."
        }
    },

    create(context) {
        const style = context.options[0] === "single" ? "single" : context.options[0] === "backtick" ? "backtick" : "double";

        const expectedLabel =
            style === "double" ? "double" : style === "single" ? "single" : "backtick";

        return {
            Literal(node) {
                if (typeof node.value !== "string" || !node.raw) {
                    return;
                }

                const raw = node.raw;
                const first = raw[0];

                if (first !== "\"" && first !== "'" && first !== "`") {
                    return;
                }

                let ok = false;

                if (style === "double" && first === "\"") {
                    ok = true;
                } else if (style === "single" && first === "'") {
                    ok = true;
                } else if (style === "backtick" && first === "`") {
                    ok = true;
                }

                if (ok) {
                    return;
                }

                const val = node.value;
                let replacement;

                if (style === "double") {
                    replacement = JSON.stringify(val);
                } else if (style === "single") {
                    replacement = `'${escapeSingle(val)}'`;
                } else {
                    replacement = `\`${escapeBacktick(val)}\``;
                }

                context.report({
                    node,
                    messageId: "wrongQuotes",
                    data: { expected: expectedLabel },
                    fix(fixer) {
                        return fixer.replaceText(node, replacement);
                    }
                });
            }
        };
    }
};
