"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum number of function parameters."
        },
        schema: [
            {
                oneOf: [{ type: "integer", minimum: 0 }, { type: "object", properties: { max: { type: "integer", minimum: 0 } } }]
            }
        ],
        messages: {
            tooManyParams: "Function '{{name}}' has too many parameters ({{count}}). Maximum is {{max}}."
        }
    },

    create(context) {
        const opt = context.options[0];
        const max = typeof opt === "number" ? opt : opt && typeof opt.max === "number" ? opt.max : 3;

        /**
         * @param {object} node
         */
        function check(node) {
            const count = node.params.length;

            if (count <= max) {
                return;
            }

            let name = "<anonymous>";

            if (node.type === "FunctionDeclaration" && node.id) {
                name = node.id.name;
            }

            context.report({
                node,
                messageId: "tooManyParams",
                data: {
                    name,
                    count: String(count),
                    max: String(max)
                }
            });
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check
        };
    }
};
