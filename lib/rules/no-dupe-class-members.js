"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow duplicate class members."
        },
        schema: [],
        messages: {
            dupeMember: "Duplicate class member '{{name}}'."
        }
    },

    create(context) {
        return {
            ClassBody(node) {
                /** @type {Set<string>} */
                const seen = new Set();

                for (const el of node.body) {
                    if (el.type !== "MethodDefinition" && el.type !== "PropertyDefinition") {
                        continue;
                    }

                    const key = el.key;

                    if (!key) {
                        continue;
                    }

                    let name;

                    if (key.type === "Identifier") {
                        name = key.name;
                    } else if (key.type === "Literal") {
                        name = String(key.value);
                    } else {
                        continue;
                    }

                    const id = `${el.static ? "static:" : "instance:"}${name}`;

                    if (seen.has(id)) {
                        context.report({
                            node: el,
                            messageId: "dupeMember",
                            data: { name }
                        });
                    }
                    seen.add(id);
                }
            }
        };
    }
};
