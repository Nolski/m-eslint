"use strict";

/**
 * @param {object} body
 * @returns {boolean}
 */
function blockHasReturn(body) {
    if (!body) {
        return false;
    }
    if (body.type !== "BlockStatement") {
        return false;
    }

    let found = false;

    const walk = (n) => {
        if (!n || typeof n !== "object") {
            return;
        }
        if (n.type === "ReturnStatement") {
            found = true;

            return;
        }
        if (
            n.type === "FunctionExpression" ||
            n.type === "FunctionDeclaration" ||
            n.type === "ArrowFunctionExpression"
        ) {
            return;
        }
        for (const key of Object.keys(n)) {
            if (key === "parent") {
                continue;
            }
            const v = n[key];

            if (Array.isArray(v)) {
                for (const c of v) {
                    walk(c);
                }
            } else if (v && typeof v === "object" && typeof v.type === "string") {
                walk(v);
            }
        }
    };

    for (const st of body.body) {
        walk(st);
    }

    return found;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Require getter accessors to contain a return statement."
        },
        schema: [],
        messages: {
            missingReturn: "Getter should return a value."
        }
    },
    create(context) {
        return {
            Property(node) {
                if (node.kind !== "get" || !node.value) {
                    return;
                }
                const fn = node.value;

                if (fn.type !== "FunctionExpression") {
                    return;
                }
                if (!blockHasReturn(fn.body)) {
                    context.report({ node: fn, messageId: "missingReturn" });
                }
            },
            MethodDefinition(node) {
                if (node.kind !== "get" || !node.value) {
                    return;
                }
                const fn = node.value;

                if (fn.type !== "FunctionExpression") {
                    return;
                }
                if (!blockHasReturn(fn.body)) {
                    context.report({ node: fn, messageId: "missingReturn" });
                }
            }
        };
    }
};
