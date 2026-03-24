"use strict";

const DEPTH_NODES = new Set([
    "IfStatement",
    "SwitchStatement",
    "TryStatement",
    "WhileStatement",
    "DoWhileStatement",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "WithStatement"
]);

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum nesting depth."
        },
        schema: [
            {
                oneOf: [{ type: "integer", minimum: 0 }, { type: "object", properties: { max: { type: "integer", minimum: 0 } } }]
            }
        ],
        messages: {
            tooDeep: "Blocks are nested too deeply ({{depth}}). Maximum allowed is {{max}}."
        }
    },

    create(context) {
        const opt = context.options[0];
        const max = typeof opt === "number" ? opt : opt && typeof opt.max === "number" ? opt.max : 4;

        let depth = 0;

        /**
         * @param {object} node
         * @returns {boolean}
         */
        function isDepthBlock(node) {
            const p = node.parent;

            return Boolean(p && DEPTH_NODES.has(p.type));
        }

        return {
            BlockStatement(node) {
                if (!isDepthBlock(node)) {
                    return;
                }

                depth++;

                if (depth > max) {
                    context.report({
                        node,
                        messageId: "tooDeep",
                        data: {
                            depth: String(depth),
                            max: String(max)
                        }
                    });
                }
            },
            "BlockStatement:exit"(node) {
                if (!isDepthBlock(node)) {
                    return;
                }

                depth--;
            }
        };
    }
};
