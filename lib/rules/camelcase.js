"use strict";

/**
 * @param {unknown} raw
 * @returns {object}
 */
function parseOpts(raw) {
    const o = raw && typeof raw === "object" ? raw : {};

    return {
        properties: o.properties === "never" ? "never" : "always",
        ignoreDestructuring: Boolean(o.ignoreDestructuring),
        ignoreImports: Boolean(o.ignoreImports),
        allow: Array.isArray(o.allow) ? o.allow : []
    };
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isCamelCase(name) {
    if (name.length === 0) {
        return true;
    }

    if (name.includes("_") || name.includes("-")) {
        return false;
    }

    return true;
}

/**
 * @param {string} name
 * @param {string[]} allow
 * @returns {boolean}
 */
function isAllowed(name, allow) {
    return allow.some((p) => {
        if (p === name) {
            return true;
        }

        if (p.endsWith("*") && name.startsWith(p.slice(0, -1))) {
            return true;
        }

        return false;
    });
}

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce camelCase naming."
        },
        schema: [
            {
                type: "object",
                properties: {
                    properties: { enum: ["always", "never"] },
                    ignoreDestructuring: { type: "boolean" },
                    ignoreImports: { type: "boolean" },
                    ignoreGlobals: { type: "boolean" },
                    allow: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            notCamelCase: "Identifier '{{name}}' is not in camel case."
        }
    },

    create(context) {
        const opts = parseOpts(context.options);

        return {
            Identifier(node) {
                const name = node.name;

                if (isCamelCase(name) || isAllowed(name, opts.allow)) {
                    return;
                }

                const parent = node.parent;

                if (
                    parent &&
                    parent.type === "Property" &&
                    parent.key === node &&
                    !parent.computed &&
                    opts.properties === "never"
                ) {
                    return;
                }

                if (
                    opts.ignoreDestructuring &&
                    parent &&
                    (parent.type === "Property" ||
                        parent.type === "AssignmentPattern") &&
                    parent.parent &&
                    parent.parent.type === "ObjectPattern"
                ) {
                    return;
                }

                if (
                    opts.ignoreImports &&
                    parent &&
                    (parent.type === "ImportSpecifier" ||
                        parent.type === "ImportDefaultSpecifier" ||
                        parent.type === "ImportNamespaceSpecifier")
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: "notCamelCase",
                    data: { name }
                });
            }
        };
    }
};
