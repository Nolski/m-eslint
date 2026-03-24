"use strict";

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow number literals that lose precision."
        },
        schema: [],
        messages: {
            lossOfPrecision: "This number literal will lose precision at runtime."
        }
    },

    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== "number" || !node.raw) {
                    return;
                }

                const raw = node.raw.replace(/_/gu, "");

                if (/^[+-]?0[box]/iu.test(raw)) {
                    return;
                }

                if (!/^[+-]?\d+$/u.test(raw)) {
                    return;
                }

                try {
                    const asBigInt = BigInt(raw);

                    if (BigInt(Number(node.value)) !== asBigInt) {
                        context.report({ node, messageId: "lossOfPrecision" });
                    }
                } catch {
                    /* not an integer literal in BigInt range */
                }
            }
        };
    }
};
