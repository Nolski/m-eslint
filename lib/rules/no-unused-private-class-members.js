"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow unused private class members."
        },
        schema: [],
        messages: {
            unused: "Private member `#{{name}}` is never read."
        }
    },
    create(context) {
        const classStacks = [];

        /**
         * @param {object} node
         */
        function currentClass() {
            return classStacks[classStacks.length - 1] || null;
        }

        return {
            ClassBody() {
                classStacks.push({ privates: new Map() });
            },
            "ClassBody:exit"() {
                const info = classStacks.pop();

                if (!info) {
                    return;
                }
                for (const [name, data] of info.privates) {
                    if (!data.read) {
                        context.report({
                            node: data.def,
                            messageId: "unused",
                            data: { name }
                        });
                    }
                }
            },
            PropertyDefinition(node) {
                const cls = currentClass();

                if (!cls || !node.key || node.key.type !== "PrivateIdentifier") {
                    return;
                }
                const name = node.key.name;

                cls.privates.set(name, { def: node.key, read: false });
            },
            MethodDefinition(node) {
                const cls = currentClass();

                if (!cls || !node.key || node.key.type !== "PrivateIdentifier") {
                    return;
                }
                const name = node.key.name;

                cls.privates.set(name, { def: node.key, read: false });
            },
            MemberExpression(node) {
                if (!node.property || node.property.type !== "PrivateIdentifier") {
                    return;
                }
                const cls = currentClass();

                if (!cls) {
                    return;
                }
                const name = node.property.name;
                const entry = cls.privates.get(name);

                if (entry && node.object.type === "ThisExpression") {
                    if (node.parent.type !== "AssignmentExpression" || node.parent.left !== node) {
                        entry.read = true;
                    }
                }
            }
        };
    }
};
