"use strict";

const esquery = require("esquery");

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow specified syntax forms."
        },
        schema: [
            {
                type: "array",
                items: { type: "string" },
                uniqueItems: true
            }
        ],
        messages: {
            restricted: "This syntax is restricted by configuration."
        }
    },
    create(context) {
        const selectors = (context.options[0] || []).filter((x) => typeof x === "string");

        if (selectors.length === 0) {
            return {};
        }

        const parsedSelectors = [];

        for (const sel of selectors) {
            try {
                parsedSelectors.push(esquery.parse(sel));
            } catch {
                // ignore invalid selectors
            }
        }

        return {
            Program(node) {
                for (const selectorAst of parsedSelectors) {
                    const matches = esquery.match(node, selectorAst);

                    for (const m of matches) {
                        context.report({ node: m, messageId: "restricted" });
                    }
                }
            }
        };
    }
};
