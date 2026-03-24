"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow renaming import/export/destructuring to the same name."
        },
        fixable: "code",
        schema: [],
        messages: {
            uselessRename: "Renaming '{{name}}' to itself is unnecessary."
        }
    },

    create(context) {
        return {
            ImportSpecifier(node) {
                if (!node.imported || !node.local) {
                    return;
                }

                if (
                    node.imported.type === "Identifier" &&
                    node.local.type === "Identifier" &&
                    node.imported.name === node.local.name
                ) {
                    context.report({
                        node,
                        messageId: "uselessRename",
                        data: { name: node.local.name },
                        fix(fixer) {
                            return fixer.replaceText(node, node.local.name);
                        }
                    });
                }
            },
            ExportSpecifier(node) {
                if (!node.local || !node.exported) {
                    return;
                }

                if (
                    node.local.type === "Identifier" &&
                    node.exported.type === "Identifier" &&
                    node.local.name === node.exported.name
                ) {
                    context.report({
                        node,
                        messageId: "uselessRename",
                        data: { name: node.local.name },
                        fix(fixer) {
                            return fixer.replaceText(node, node.local.name);
                        }
                    });
                }
            },
            Property(node) {
                if (node.kind !== "init" || node.computed) {
                    return;
                }

                const k = node.key;
                const v = node.value;

                if (
                    k.type === "Identifier" &&
                    v.type === "Identifier" &&
                    k.name === v.name &&
                    node.parent &&
                    node.parent.type === "ObjectPattern"
                ) {
                    context.report({
                        node,
                        messageId: "uselessRename",
                        data: { name: k.name },
                        fix(fixer) {
                            return fixer.replaceText(node, k.name);
                        }
                    });
                }
            }
        };
    }
};
