"use strict";

/**
 * @param {object} node
 * @returns {boolean}
 */
function isConstantExpression(node) {
    if (!node) {
        return false;
    }
    if (node.type === "Literal") {
        return true;
    }
    if (node.type === "UnaryExpression") {
        return isConstantExpression(node.argument);
    }
    if (node.type === "BinaryExpression") {
        return isConstantExpression(node.left) && isConstantExpression(node.right);
    }
    if (node.type === "LogicalExpression") {
        return isConstantExpression(node.left) && isConstantExpression(node.right);
    }
    if (node.type === "TemplateLiteral") {
        return node.expressions.length === 0;
    }

    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow conditions that are always constant."
        },
        schema: [
            {
                type: "object",
                properties: {
                    checkLoops: { type: "boolean" }
                },
                additionalProperties: false
            }
        ],
        messages: {
            constantCondition: "Constant condition detected."
        }
    },
    create(context) {
        const opts =
            context.options && typeof context.options === "object" && !Array.isArray(context.options)
                ? context.options
                : {};
        const checkLoops = opts.checkLoops !== false;

        function checkTest(node, parentType) {
            if (!node) {
                return;
            }
            if (!isConstantExpression(node)) {
                return;
            }
            if (!checkLoops && (parentType === "WhileStatement" || parentType === "DoWhileStatement")) {
                return;
            }

            context.report({ node, messageId: "constantCondition" });
        }

        return {
            IfStatement(node) {
                checkTest(node.test, "IfStatement");
            },
            ConditionalExpression(node) {
                checkTest(node.test, "ConditionalExpression");
            },
            WhileStatement(node) {
                checkTest(node.test, "WhileStatement");
            },
            DoWhileStatement(node) {
                checkTest(node.test, "DoWhileStatement");
            },
            ForStatement(node) {
                checkTest(node.test, "ForStatement");
            }
        };
    }
};
