"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require adjacent getter and setter pairs."
        },
        schema: [],
        messages: {
            split: "Accessor pair for `{{name}}` should be grouped together."
        }
    },
    create(context) {
        return {
            ObjectExpression(node) {
                const acc = [];

                for (const prop of node.properties) {
                    if (prop.type !== "Property" || (prop.kind !== "get" && prop.kind !== "set")) {
                        continue;
                    }
                    const key =
                        prop.key.type === "Identifier"
                            ? prop.key.name
                            : prop.key.type === "Literal"
                              ? String(prop.key.value)
                              : null;

                    if (!key) {
                        continue;
                    }
                    acc.push({ key, kind: prop.kind, node: prop });
                }
                for (let i = 0; i < acc.length - 1; i += 1) {
                    const a = acc[i];
                    const b = acc[i + 1];

                    if (a.key === b.key && a.kind !== b.kind) {
                        const between = b.node.range[0] - a.node.range[1];

                        if (between > 2) {
                            context.report({ node: b.node, messageId: "split", data: { name: a.key } });
                        }
                    }
                }
            }
        };
    }
};
