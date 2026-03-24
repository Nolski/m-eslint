"use strict";

/**
 * @param {object} body
 * @returns {boolean}
 */
function hasSuperCall(body) {
    if (!body) {
        return false;
    }
    if (body.type !== "BlockStatement") {
        return false;
    }

    let found = false;

    const visit = (n) => {
        if (!n || typeof n !== "object") {
            return;
        }
        if (n.type === "FunctionExpression" || n.type === "FunctionDeclaration") {
            return;
        }
        if (n.type === "CallExpression" && n.callee && n.callee.type === "Super") {
            found = true;

            return;
        }
        for (const key of Object.keys(n)) {
            if (key === "parent") {
                continue;
            }
            const v = n[key];

            if (Array.isArray(v)) {
                for (const c of v) {
                    visit(c);
                }
            } else if (v && typeof v === "object" && typeof v.type === "string") {
                visit(v);
            }
        }
    };

    for (const st of body.body) {
        visit(st);
    }

    return found;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Require super() calls in constructors of subclasses."
        },
        schema: [],
        messages: {
            missingSuperCall: "Missing super() call in constructor of derived class."
        }
    },
    create(context) {
        return {
            ClassBody(node) {
                const classNode = node.parent;

                if (
                    !classNode ||
                    (classNode.type !== "ClassDeclaration" && classNode.type !== "ClassExpression")
                ) {
                    return;
                }
                if (!classNode.superClass) {
                    return;
                }

                for (const el of node.body) {
                    if (el.type !== "MethodDefinition" || el.kind !== "constructor") {
                        continue;
                    }
                    const fn = el.value;

                    if (!fn || (fn.type !== "FunctionExpression" && fn.type !== "FunctionDeclaration")) {
                        continue;
                    }
                    if (!hasSuperCall(fn.body)) {
                        context.report({ node: el, messageId: "missingSuperCall" });
                    }
                }
            }
        };
    }
};
