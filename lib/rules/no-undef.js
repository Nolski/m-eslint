"use strict";

const { analyzeScope } = require("./scope-analyze.js");

/**
 * @param {object} node
 */
function isTypeofOperand(node) {
    const p = node.parent;

    return Boolean(
        p && p.type === "UnaryExpression" && p.operator === "typeof" && p.argument === node
    );
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow references to identifiers that are not declared."
        },
        schema: [
            {
                type: "object",
                properties: {
                    typeof: { type: "boolean" }
                },
                additionalProperties: false
            }
        ],
        messages: {
            undeclared: "'{{name}}' is not defined."
        }
    },
    create(context) {
        const opts =
            context.options && typeof context.options === "object" && !Array.isArray(context.options)
                ? context.options
                : {};
        const checkTypeofOperands = opts.typeof !== false;

        return {
            "Program:exit"(node) {
                const scopeManager = analyzeScope(node, context.languageOptions);

                for (const scope of scopeManager.scopes) {
                    for (const ref of scope.references) {
                        if (!ref.identifier || ref.resolved !== null) {
                            continue;
                        }
                        if (ref.identifier.name === "undefined") {
                            continue;
                        }

                        if (!checkTypeofOperands && isTypeofOperand(ref.identifier)) {
                            continue;
                        }

                        context.report({
                            node: ref.identifier,
                            messageId: "undeclared",
                            data: { name: ref.identifier.name }
                        });
                    }
                }
            }
        };
    }
};
