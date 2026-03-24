"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce getter and setter pairs on objects and classes."
        },
        schema: [],
        messages: {
            missing: "Expected a matching {{kind}} for property `{{name}}`."
        }
    },
    create(context) {
        return {
            ObjectExpression(node) {
                const getters = new Set();
                const setters = new Set();

                for (const prop of node.properties) {
                    if (prop.type !== "Property" || prop.kind === "init") {
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
                    if (prop.kind === "get") {
                        getters.add(key);
                    }
                    if (prop.kind === "set") {
                        setters.add(key);
                    }
                }
                for (const name of getters) {
                    if (!setters.has(name)) {
                        context.report({ node, messageId: "missing", data: { kind: "setter", name } });
                    }
                }
                for (const name of setters) {
                    if (!getters.has(name)) {
                        context.report({ node, messageId: "missing", data: { kind: "getter", name } });
                    }
                }
            }
        };
    }
};
